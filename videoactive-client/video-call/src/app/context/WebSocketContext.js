"use client"; // Ensure it's a client component

import { createContext, use, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchAuthToken, fetchMessages } from "../services/api";
import { usePathname } from "next/navigation";

/**
 * Initializes a React Context to manage WebSocket connections and signaling for direct calling.
 * This context handles:
 *  - Establishing the WebSocket connection
 *  - Managing online contacts
 *  - Handling incoming/outgoing calls
 *  - Receiving real-time messages
 */
const WebSocketContext = createContext(null);

/**
 * Provides WebSocket connection functionality to the app.
 * - Establishes a WebSocket connection using an authToken
 * - Sends/receives signaling messages (offer, answer, hang-up, ICE)
 * - Maintains user presence (online status)
 * - Handles real-time messaging
 *
 * @param {ReactNode} children - Components wrapped by this provider
 */
export const WebSocketProvider = ({ children }) => {
  const pathname = usePathname(); // ✅ Get current path
  const router = useRouter();
  const socketRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [onlineContacts, setOnlineContacts] = useState([]);
  const [incomingCalls, setIncomingCalls] = useState([]); // Store incoming call data
  const [offerData, setOfferData] = useState(null); // Store offer data
  const [answerData, setAnswerData] = useState(null); // Store answer data
  const [hangUpData, setHangUpData] = useState(null); // Store hang-up data
  const [iceCandidateData, setIceCandidateData] = useState(null); // Store ICE candidate data
  const [messageHistory, setMessageHistory] = useState([]);
  // messageHistory would be an array of objects with sender and message properties, sorted by timestamp
  // Example: [{ sender: "User1", message: "Hi", createdAt: "2022-01-01T12:00:00Z" }, ...]

  const pingIntervalRef = useRef(null);

/**
 * Fetches and sets the current authenticated user's ID.
 * Called on every route change to refresh user state.
 */
    const checkUser = useCallback(async () => {
      const userData = await fetchUser();
      setClientId(userData.user.uid);
    }, []);

    /**
   * Re-run checkUser() on navigation (after login)
   */
    useEffect(() => {
      checkUser();
    }, [pathname]);

/**
 * Fetches the authentication token needed for WebSocket connection.
 * Called when clientId is available.
 */
    useEffect(() => {
      if (!clientId || clientId === "DefaultClient") return;
      const fetchToken = async () => {
          await fetchAuthToken().then((data) => {
            console.log("Auth token fetched: ", data);
            setAuthToken(data);
          });
      };
      fetchToken();
    }, [clientId]);

  
    /**
   * Fetches initial chat messages after token is available.
   * Populates the messageHistory state for display and logic.
   */
    useEffect(() => {
      const fetchMessagesData = async () => {
        if (!authToken) return;
        await fetchMessages().then((data) => {
          console.log("Messages fetched: ", data);
          setMessageHistory(data.messages.map((message) => ( // Push fetched messages to messageHistory
            { 
              sender: message.senderId, 
              receiver: message.receiverId, 
              senderName: message.senderName, 
              message: message.messageText, 
              createdAt: message.createdAt 
            }
          )));
        });
      };
      fetchMessagesData();
    }, [authToken]);


  /**
   * Initializes and manages the WebSocket connection:
   * - Opens the connection with the authToken
   * - Pings the server every 30 seconds
   * - Listens for messages and handles them via `handleMessage()`
   * - Cleans up on unmount
   */
  useEffect(() => {
    console.log("clientId: ", clientId);
    console.log("authToken: ", authToken);
    if (!clientId || clientId === "DefaultClient") return;
    if (!authToken) return;

    try {

      console.log("authToken: ", authToken);

      const socketConnection = new WebSocket(
        `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
      ); // Build connection with websocket server

      socketConnection.onopen = () => {
        console.log("Connected to WebSocket server");
      };

      // Periodically sending a ping message to keep the connection alive.
      pingIntervalRef.current = setInterval(() => {
        if (socketConnection.readyState === WebSocket.OPEN) {
          console.log("Ping to WebSocket server");
          socketConnection.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // 30 seconds

      socketConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
          console.log("Message received from server: ", message);
        } catch (error) {
          console.error(error);
        }
      };

      socketConnection.onclose = () => {
        console.log("Disconnected from WebSocket server");
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };

      socketRef.current = socketConnection;
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    }; // Close the connection when the component unmounts
  }, [clientId, authToken]);

  /**
 * Gracefully handles tab closing or refresh events
 * by closing WebSocket and clearing ping interval.
 */
  useEffect(() => {
    const handleUnload = (event) => {
      event.preventDefault();
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  /**
   * Handles all incoming WebSocket messages and routes them based on their type.
   * Supports contact status changes, signaling messages, and instant messages.
   *
   * @param {Object} message - Parsed WebSocket message object
   */
  const handleMessage = (message) => {
    switch (message.type) {
      case "online-contacts": // User's online contacts
        if (Array.isArray(message.contacts)) {
          setOnlineContacts((prevContacts) => {
            // Filter out any undefined values from the previous contacts
            const filteredContacts = prevContacts.filter(contact => contact);
            
            // Merge new contacts, ensuring uniqueness based on contactId
            const newContacts = message.contacts.filter(newContact =>
              !filteredContacts.some(contact => String(contact.contactId) === String(newContact.contactId))
            );
            
            return [...filteredContacts, ...newContacts];
          });
        }
        break;

      case "contact-online": // A contact has come online
        if (message.contact && message.contact.contactId) {
          setOnlineContacts((prevContacts) => {
            // Ensure no undefined values are included
            const filteredContacts = prevContacts.filter(contact => contact);
            
            // Prevent duplicates before adding
            const contactExists = filteredContacts.some(contact => String(contact.contactId) === String(message.contact.contactId));
            
            return contactExists ? filteredContacts : [...filteredContacts, message.contact];
          });
        }
        break;

      case "contact-offline": // A contact has gone offline
        console.log("Contact offline: ", message.contact);
        if (message.contact && message.contact.contactId) {
          setOnlineContacts((prevContacts) =>
            prevContacts.filter(contact => contact && String(contact.contactId) !== String(message.contact.contactId))
          );
        }
        break;

      case "signal": // Signaling message, used for WebRTC
        handleSignalingMessage(message);
        break;

      default:
        console.warn("Unknown message type:", message.type);
        break;
    }
  };

  /**
 * Sends a WebRTC signaling message to the server.
 *
 * @param {string} type - Type of signal (offer, answer, hang-up, etc.)
 * @param {string} to - Target user ID
 * @param {string} from - Sender user ID
 * @param {Object} signal - Signal payload (SDP, ICE, etc.)
 */
  const sendSignalingMessage = (type, to, from, signal) => {
    const message = {
        type: 'signal',
        to: to,
        from: from,
        signalType: type,
        signalData: signal,
    };
    if (socketRef) {
        console.log("Sending signal: ", message);
        socketRef.current.send(JSON.stringify(message));
    } else {
        console.error("Socket connection not available.");
    }
  };

  /**
 * Handles various WebRTC signaling types (offer, answer, ICE candidate, hang-up, instant message).
 * Updates appropriate state for call signaling or messaging.
 *
 * @param {Object} message - WebSocket message with signaling data
 */
  const handleSignalingMessage = (message) => {
    console.log("Signal received: ", message);
    switch (message.signalType) {
        case 'offer':
            console.log("Incoming call from:", message.from);
            setIncomingCalls(prevCalls => [...prevCalls, message]); // Add to the list, used to display incoming calls
            break;
        case 'answer':
            console.log("Answer received from:", message.from);
            setAnswerData(message); // Set answer data, handle at the callee's end (connection/page.js)
            break;
        case 'hang-up':
            console.log("Hang-up received from:", message.from);
            setIncomingCalls(prevCalls => prevCalls.filter(call => call.from !== message.from)); // Remove from the list
            setHangUpData(message); // Set hang-up data, handle at the callee's end (connection/page.js)
            break;
        case 'ice-candidate':
            console.log("ICE candidate received from:", message.from);
            setIceCandidateData(message); // Set potential network paths for the WebRTC connection
            break;
        case 'instant-message':
            console.log("Instant message received from:", message.from);
            setMessageHistory(prevMessages => 
              [
                ...prevMessages, 
                { 
                  sender: message.from, 
                  receiver: message.to, 
                  senderName: message.signalData.senderName, 
                  message: message.signalData.content, 
                  createdAt: message.signalData.createdAt 
                }
              ]
            );
            break;
        default:
            console.warn("Unknown signal type: ", message.signalType);
            break;
    }
  }

  /**
   * Logs incoming call details whenever the call state updates.
   */
  useEffect(() => {
    if(incomingCalls.length > 0) {
        console.log("Incoming call detected");
        console.log("Incoming call data: ", incomingCalls);
    }
  }, [incomingCalls]);
/**
 * Exposes WebSocket-related state and actions to other components.
 * Use `useWebSocket()` hook to access values in other components.
 */
  return (
    <WebSocketContext.Provider value={
        {   socketRef, 
            clientId, 
            onlineContacts, setOnlineContacts, 
            incomingCalls, setIncomingCalls, 
            offerData, setOfferData,
            answerData, setAnswerData, 
            hangUpData, setHangUpData,
            iceCandidateData, setIceCandidateData,
            sendSignalingMessage,
            messageHistory, setMessageHistory 
        }
    }>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context inside any component.
 *
 * @returns {Object} WebSocket state and methods
 */
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
