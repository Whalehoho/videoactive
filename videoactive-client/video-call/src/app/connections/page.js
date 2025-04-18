"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchContacts, insertMessage } from "../services/api"; // ✅ Use centralized API function
import { useWebSocket } from '../context/WebSocketContext'; // ✅ Use WebSocket context
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; // Import the styles for the resizable component
import { logStartCall, logEndCall } from "../services/api";


  /**
 * Renders the Connection page for the ViMeet application.
 *
 * This component displays:
 * All online contacts and their status
 * Manages WebSocket context variables for real-time communication
 * Manages connection, signaling messages, and incoming data such as offers, answers, and ICE candidates.
 *
 * @returns {JSX.Element} The rendered About page component.
 */
export default function ConnectionPage() {
  const { 
    socketRef, 
    clientId, 
    onlineContacts, setOnlineContacts, 
    incomingCalls, setIncomingCalls, 
    offerData, setOfferData,
    answerData, setAnswerData, 
    hangUpData, setHangUpData,
    iceCandidateData, setIceCandidateData,
    sendSignalingMessage,
    messageHistory, setMessageHistory
  } = useWebSocket(); // Use WebSocket context instead of building a new one when visiting the page
  // these are the states for incoming calls, offer data, answer data, hang-up data, and ICE candidate data


    /**
   * State management for call details and message data
   * - targetClientId: Stores the client ID of the selected contact for the current communication.
   * - status: Stores the current status of the connection (e.g., idle, calling).
   * - peerRef: Stores the WebRTC peer connection object.
   * - local/remoteVideoRef: Stores references to the local and remote video streams.
   * - localStreamRef/remoteStreamRef: References for media streams.
   * - candidateQueue: A queue to store ICE candidates before establishing the peer connection.
   */
  const [targetClientId, setTargetClientId] = useState(null);
  const targetClientIdRef = useRef(targetClientId);
  const [status, setStatus] = useState("idle");
  const statusRef = useRef(status);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueue = useRef([]);
  /**
   * State for contacts and chat functionality
   * - contacts: Holds the list of available contacts (both online and offline).
   * - messageToSend: Stores the content of the message that is being typed or about to be sent.
   */
  const [contacts, setContacts] = useState([]);
  const [messageToSend, setMessageToSend] = useState("");
 
  /**
   * Router and user state management
   * - router: For navigation control.
   * - user: Stores the logged-in user data.
   * - loading: Indicates whether the user data is still being loaded.
   * - search: Stores the search term for filtering contacts.
   */
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /**
   * Chat box visibility and scrolling management
   * - showChatBox: Boolean to control whether the chat box is visible.
   * - messagesEndRef: A reference to handle scrolling behavior to the latest message.
   */
  const [showChatBox, setShowChatBox] = useState(true);
  const messagesEndRef = useRef(null);

  /**
   * Effect hook for scrolling to the latest message when message history updates
   * - This effect runs when new messages are added to the message history, ensuring the chat box always shows the most recent messages.
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messageHistory,showChatBox ]);

  /**
   * Effect hook to show chat box when a new message arrives
   * - This effect is triggered when a new message is received from the selected contact.
   * - It ensures that the chat box becomes visible when there is a new message.
   */
  useEffect(() => {
    // If a new message arrives from the selected contact
    const hasNewMessage = messageHistory.some(
      msg => String(msg.sender) === String(targetClientId) && String(msg.receiver) === String(clientId)
    );
    
    if (hasNewMessage && targetClientId) {
      setShowChatBox(true);
    }
  }, [messageHistory, targetClientId]);

  /**
   * Handler for when a contact is clicked
   * - Sets the target client ID to the selected contact.
   * - Shows the chat box and scrolls to the latest message.
   * @param {string} contactId - The ID of the selected contact.
   */
  const handleContactClick = (contactId) => {
    setTargetClientId(contactId);
    targetClientIdRef.current = contactId;
    setShowChatBox(true); // Show chat box when a contact is selected
    
    // Add a small delay to ensure DOM is updated before scrolling
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }
    }, 100);
  };
  

  /**
   * ICE servers configuration
   * - Defines STUN and TURN servers to be used for establishing peer-to-peer connections.
   * - Uses public STUN servers from Google and custom TURN servers if available.
   */
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      {
        urls: process.env.NEXT_PUBLIC_TURN_SERVER_CUSTOM_UDP,
        username: process.env.NEXT_PUBLIC_TURN_CUSTOM_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CUSTOM_CREDENTIAL,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURNS_SERVER_CUSTOM_TCP,
        username: process.env.NEXT_PUBLIC_TURN_CUSTOM_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CUSTOM_CREDENTIAL,
      },
    ],
  };
  // ICE serves help establish a connection between peers by bypassing NAT and firewalls
  // STUN servers help find the public IP address of a user
  // TURN servers help relay media if direct connection fails, consumes more bandwidth, and is slower
  // We use free TURN servers from Xirsys, so calls might fail ocassionally

  
  

  useEffect(() => {
    console.log("Online contacts: ", onlineContacts);
  }, [onlineContacts]);

  useEffect(() => {
    console.log("Message history: ", messageHistory);
  }, [messageHistory]);

   /**
   * Effect hook to fetch the user data on component mount
   * - Fetches user data from the server, and if the user is not authenticated, redirects to the login page.
   */
  useEffect(() => {
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, []);

  /**
   * Effect hook to fetch contacts from the server
   * - Retrieves both online and offline contacts and stores them in the contacts state.
   */
  useEffect(() => {
    //fetch contacts from the server (both online and offline)
    const fetchContactsData = async () => {
      await fetchContacts().then((data) => {
        if (data && data.contacts) {
          console.log("Contacts fetched: ", data.contacts);
          setContacts(data.contacts);
        }
      });
    };
    fetchContactsData();
  }, []);
  /**
   * Cleanup effect on component unmount
   * - Handles necessary cleanup tasks such as hanging up calls.
   */
  useEffect(() => {
    // This cleanup function will run when component unmounts
    return () => {
        console.log("Component unmounting - cleaning up");
        hangUp();
    };
  }, []); // Empty dependency array means this runs only on mount/unmount

  /**
   * Effect hook to handle incoming answer data
   * - Sets the remote description for the peer connection when an answer is received.
   * - Processes any queued ICE candidates after the remote description is set.
   */
    useEffect(() => {
    if (!answerData) {
      return;
    }
    console.log("Got answer data?", answerData)
    const handleAnswer = async (message) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(message))
        .catch(error => {
            console.error("Error setting remote description: ", error);
        });
        await processQueuedCandidates(); // Process ICE candidates that were stored earlier
    };
    console.log("Answer signal data: ", answerData.signalData);
    handleAnswer(answerData.signalData);
  }, [answerData]);

  /**
   * Effect hook to handle hang-up signals
   * - Ends the call when a hang-up signal is received.
   */
  useEffect(() => {
    if (!hangUpData) {
      return;
    }
    hangUp();
  }, [hangUpData]);

  /**
   * Effect hook to handle incoming ICE candidates
   * - Adds ICE candidates to the peer connection if they are received.
   */
    useEffect(() => {
    if (!iceCandidateData) {
      return;
    }
    
    const handleIceCandidate = async (message) => {
      // Candidate must be added after setting remote description
      if (!peerRef.current) {
        console.warn("Peer connection not initialized. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      if (!peerRef.current.remoteDescription) {
        console.warn("Remote description not set yet. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      try {
        // Add the ICE candidate so that the peer knows how to reach us
        await peerRef.current.addIceCandidate(new RTCIceCandidate(message.signalData));
        console.log("ICE candidate added successfully.");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };
  
    handleIceCandidate(iceCandidateData);
  }, [iceCandidateData]);
  
  /**
    * Processes queued ICE candidates that were received before setting remote description.
  */
  const processQueuedCandidates = async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) {
      console.warn("Cannot process ICE candidates: Remote description not set.");
      return;
    }

    if(candidateQueue.current.length <= 0) {
      console.log("No ICE candidate in queue");
    }
  
    while (candidateQueue.current.length > 0) {
      var i = 0;
      const candidate = candidateQueue.current.shift();
      peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => 
        { 
          console.log(++i)
        }
        )
        .catch(error => console.error("Error adding queued ICE candidate:", error));
    }
  };
/**
   * Initiates a call by creating the peer connection and sending an offer.
   */
  const startCall = async () => {
    try{
      if(!targetClientId) return;
      console.log("Starting call with: ", targetClientId);
      setStatus("calling");
      statusRef.current = "calling";
      await createPeerConnection();
      await createOffer();
    } catch (error) {
      console.error(error);
    }
  };
  /**
   * Answers an incoming call by setting the remote offer, processing ICE candidates, and sending an answer.
   */
  const answerCall = async () => {
    try {
      if(!targetClientId) return;
      setIncomingCalls(prevCalls => prevCalls.filter(call => String(call.from) !== String(targetClientId))); // Remove from the queue
      console.log("Answering call from: ", targetClientId);
      setStatus("calling");
      statusRef.current = "calling";
      // Set offer data from incoming call
      const remoteOfferData = incomingCalls.find(call => String(call.from) === String(targetClientId))?.signalData;
      if(!remoteOfferData) {
        console.error("No offer data found for incoming call.");
        return;
      }
      await createPeerConnection();
      console.log("Setting remote description with offer data: ", remoteOfferData);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteOfferData));
      await processQueuedCandidates(); // Add ICE candidates that were stored earlier
      await createAnswer();

      // Log the call start (store into database)
      // console.log("Client ID: ", clientId, " Target Client ID: ", targetClientId);
      await logStartCall(clientId, targetClientId, "direct");


    } catch (error) {
      console.error(error);
    }
  };
 /**
   * Terminates the call, cleans up peer and media resources, and notifies the other peer.
   */
  const hangUp = async () => {
    if(statusRef.current === "idle") {
      console.log("No active call to hang up.");
      return;
    }
    // Log the call end
    await logEndCall(clientId, targetClientId);
    console.log("Hanging up call...");
    setStatus("idle");
    statusRef.current = "idle";
    console.log("Sending hang-up signal from: ", clientId, " to: ", targetClientId);
    sendSignalingMessage('hang-up', targetClientIdRef.current, clientId, null); // Use ref to get the target client ID because it may have been reset
    setTargetClientId(null);
    targetClientIdRef.current = null;
    setOfferData(null);
    setIceCandidateData(null);
    candidateQueue.current = [];

    if(peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if(localVideoRef.current && localVideoRef.current.srcObject) {
          localVideoRef.current.srcObject = null;
      }
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    

  };

 /**
   * Requests access to user's media devices (camera and microphone) and returns the stream.
   */
  const getLocalMedia = async () => {
    try {
    if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
        });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        console.log("Local media stream obtained.", stream);
    }
    return localStreamRef.current;
    } catch (error) {
    console.error("Error accessing media devices.", error);
    throw error;
    }
  };

  /**
   * Initializes the RTCPeerConnection, adds local media tracks, and sets up event handlers.
   */
  const createPeerConnection = async () => {
    if(!localStreamRef.current) {
      console.log("Local media stream not available. Fetching...");
        await getLocalMedia();
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    peerRef.current = new RTCPeerConnection(iceServers);

    localStreamRef.current.getTracks().forEach(track => {
        peerRef.current.addTrack(track, localStreamRef.current);
    });

     // Debugging logs
     console.log("Local tracks added: ", localStreamRef.current.getTracks());

     peerRef.current.ontrack = (event) => {
      const remoteStream = event.streams[0];

      console.log("Incoming remote stream:", event.streams[0])
      console.log("Check stream tracks:", remoteStream.getTracks())
      console.log("Check video tracks:", remoteStream.getVideoTracks())

      // Force Video Rendering by Restarting Track
      // if(remoteStream.getVideoTracks()){
      //   remoteStream.getVideoTracks().forEach(track => {
      //     track.enabled = false;
      //     setTimeout(() => (track.enabled = true), 500);
      //   });
        
      // }
    
      // Avoid setting the srcObject multiple times
      if (!remoteVideoRef.current.srcObject || remoteVideoRef.current.srcObject !== remoteStream) {
        remoteStreamRef.current = remoteStream;
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("Setting up remote video with remote stream")
      }

    
      // Delay playing the video slightly
      setTimeout(() => {
        console.log("Remote video Status:", remoteVideoRef.current.readyState);
        if (remoteVideoRef.current.paused || remoteVideoRef.current.ended) {
          remoteVideoRef.current.play().then(
            () => {
              console.log("Playing video")
            }
          ).catch(error => {
            console.error("Error playing remote video:", error);
          });
        }
      }, 500); // Add slight delay to allow proper loading
    };

    peerRef.current.onicecandidate = (event) => { // When available ice candidate is found
      if (event.candidate) {
        // console.log("Sending ICE candidate to peer: ", event.candidate);
        sendSignalingMessage('ice-candidate', targetClientId, clientId, event.candidate);
      }
    };
  };


  /**
   * Creates an SDP offer and sends it to the target client.
   */
  const createOffer = async () => {
    console.log('socketRef: ', socketRef);
    try {
        if (!peerRef.current) {
            createPeerConnection(); // Ensure peerRef.current is set
        }
        console.log("peerRef.current: ", peerRef.current);
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        console.log("Offer created: ", offer);
        sendSignalingMessage('offer', targetClientId, clientId, offer);
        // Sleep a bit to ensure callee have enuf time to set up peer connection
        await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
        console.error("Error creating offer: ", error);
    }
  };


  /**
   * Creates an SDP answer and sends it back to the caller.
   */
  const createAnswer = async () => {
      try {
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          console.log("Answer created: ", answer);
          sendSignalingMessage('answer', targetClientId, clientId, answer);
      } catch (error) {
          console.error("Error creating answer: ", error);
      }
  };

  const sendMessage = async () => {
    if (!messageToSend || !targetClientId) return;
    console.log(`Sending message from ${clientId} to ${targetClientId}: `, messageToSend);
    const createdAt = new Date().toISOString();
    sendSignalingMessage(
      'instant-message', 
      targetClientId, clientId, 
      { 
        senderName: user.username,
        content: messageToSend, 
        createdAt: createdAt
       }
    );
    setMessageHistory(prevMessages => [...prevMessages, { sender: clientId, receiver: targetClientId, message: messageToSend, createdAt: createdAt }]);
    await insertMessage(messageToSend, clientId, targetClientId); // ✅ Insert message into database
    setMessageToSend("");
    setShowChatBox(true); // Ensure chat box is open when sending a message

  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-pink-500">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col md:flex-row relative">
        {/* Sidebar - Online Contacts */}
        <aside className="w-full md:w-1/5 bg-gray-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black border border-gray-300 rounded"
          />
          <ul className="space-y-2 mt-3">
            {contacts
              .filter((contact) =>
                contact?.contactName.toLowerCase().includes(search.toLowerCase())
              )
              .map((contact) => {
                const isOnline = onlineContacts.some(
                  (online) => String(online.contactId) === String(contact.contactId)
                );
  
                const hasIncomingCall = incomingCalls.some(
                  (call) => String(call.from) === String(contact.contactId)
                );
  
                return (
                  <li
                  key={contact.contactId}
                  onClick={() => {
                    handleContactClick(contact.contactId);
                    targetClientIdRef.current = contact.contactId;
                  }}
                  className={`group relative p-2 flex items-center space-x-3 rounded-lg cursor-pointer transition-all ${
                    String(targetClientId) === String(contact.contactId)
                      ? 'bg-blue-500'
                      : 'hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  {/* Profile Picture */}
                  <img
                    src={
                      contact.profilePic ||
                      'https://my-video-active-bucket.s3.amazonaws.com/videoCall/public/profile_default.jpg'
                    }
                    alt={`${contact.contactName}'s profile`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-300"
                  />


                  {/* Name & Online Status */}
                  <span className={`${isOnline ? 'text-green-400 font-semibold' : ''}`}>
                    {contact.contactName}
                  </span>


                  {/* Incoming Call Ping */}
                  {hasIncomingCall && (
                    <span className="absolute top-1 right-2 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                  )}


                  {/* Description Tooltip */}
                  {contact.description && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 bg-gray-400 text-white text-sm rounded px-3 py-1 shadow-lg whitespace-nowrap z-50 transition-opacity duration-200">
                      {contact.description}
                    </div>
                  )}
                </li>
                );
              })}
          </ul>
        </aside>
  
        {/* Chat Box - Resizable and Positioned Correctly */}
        {/* Chat Box - Auto-scrolling */}
        {targetClientId && showChatBox && (
          <div className="absolute top-4 left-1/4 z-50 rounded-lg p-4">
            <ResizableBox
              width={400}
              height={200}
              minConstraints={[300, 150]}
              maxConstraints={[600, 800]}
              className="rounded-lg overflow-hidden bg-white border-2 border-gray-700 shadow-lg"
              resizeHandles={["se"]}
            >
              <div className="flex flex-col h-full">
                {/* Chat Header with Close Button */}
                <div className="flex justify-between items-center bg-gray-700 text-white p-2">
                  <span className="font-semibold">
                    {contacts.find(contact => String(contact.contactId) === String(targetClientId))?.contactName || "Chat"}
                  </span>
                  <button 
                    onClick={() => setShowChatBox(false)}
                    className="text-white hover:text-red-300"
                  >
                    ❌
                  </button>
                </div>
                
                {/* Message History with ref for scrolling */}
                <div 
                  ref={messagesEndRef}
                  className="flex-grow overflow-y-auto border-b-2 border-gray-200 p-2"
                >
                  {messageHistory
                    .filter(
                      (msg) =>
                        (String(msg.sender) === String(clientId) && String(msg.receiver) === String(targetClientId)) || 
                        (String(msg.sender) === String(targetClientId) && String(msg.receiver) === String(clientId))
                    )
                    .map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          String(msg.sender) === String(targetClientId) ? "justify-start" : "justify-end"
                        } p-2`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 max-w-xs break-words ${
                            String(msg.sender) === String(targetClientId)
                              ? "bg-gray-200 text-black"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {/* <span className="font-semibold">
                            {String(msg.sender) === String(targetClientId) ? `${msg.senderName}:` : ""}
                          </span>{" "} */}
                          {msg.message}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Input and Send Button */}
                <div className="flex items-center space-x-2 p-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageToSend}
                    onChange={(e) => setMessageToSend(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        await sendMessage();
                      }
                    }}
                    className="flex-1 p-2 text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </ResizableBox>
          </div>
        )}

        {/* Add a Chat Button when chat is closed but target is selected
        {targetClientId && !showChatBox && (
          <div className="absolute bottom-4 right-4 z-50">
            <button
              onClick={() => setShowChatBox(true)}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition flex items-center gap-2"
            >
              <span>Open Chat</span>
            </button>
          </div>
        )} */}
  
        {/* Video Call Section */}
        <section className="flex-1 flex flex-col items-center justify-center p-10 relative">
          <h2 className="text-xl font-bold text-pink-500 mb-4">Username: {user?.username}</h2>
          <div className="mb-2 text-lg text-gray-500">
            {targetClientId ? (
              incomingCalls.some((call) => String(call.from) === String(targetClientId)) ? (
                <p>
                  Answer{" "}
                  <span className="font-semibold">
                    {contacts.find((contact) => String(contact.contactId) === String(targetClientId))
                      ?.contactName}
                  </span>
                </p>
              ) : (
                <p>
                  Calling:{" "}
                  <span className="font-semibold">
                    {contacts.find((contact) => String(contact.contactId) === String(targetClientId))
                      ?.contactName}
                  </span>
                </p>
              )
            ) : (
              <p className="text-gray-500">Select a contact to start a call.</p>
            )}
          </div>
  
          {/* Call Buttons */}
          {status === "idle" && (
            incomingCalls.some((call) => String(call.from) === String(targetClientId)) ? (
              <button
                onClick={answerCall}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
              >
                Answer
              </button>
            ) : (
              <button
                onClick={startCall}
                className={`px-6 py-3 font-semibold rounded-lg shadow-md transition ${
                  onlineContacts.some((online) => String(online.contactId) === String(targetClientId))
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
                disabled={
                  !onlineContacts.some((online) => String(online.contactId) === String(targetClientId))
                }
              >
                Start Call
              </button>
            )
          )}
  
          {status === "calling" && (
            <>
              <div className="w-full h-[60vh] flex items-end justify-start relative">
                <ResizableBox
                  width={800}
                  height={500}
                  minConstraints={[600, 300]}
                  maxConstraints={[1500, 700]}
                  className="rounded-lg overflow-hidden border border-gray-300 shadow-lg"
                  resizeHandles={["ne"]}
                >
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="relative z-10 w-full h-full object-cover" 
                  />
                  {/* Removed the status message from here */}
                </ResizableBox>
              </div>
              
              <div className="flex flex-col items-center space-y-3 mt-4">
                {/* Status message - Added with improved styling */}
                <div className="animate-pulse">
                  <p className="text-base font-medium bg-black bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm text-white">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                    Receiving media from peer...
                  </p>
                </div>
                
                <button
                  onClick={hangUp}
                  className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition"
                >
                  Hang Up
                </button>
              </div>
            </>
          )}
  
          {/* Local Video - Positioned Absolutely */}
          {status === "calling" && (
            <div className="absolute top-4 right-4 z-30">
              <ResizableBox
                width={250}
                height={160}
                minConstraints={[250, 160]}
                maxConstraints={[500, 480]}
                className="rounded-lg border border-black shadow-lg overflow-hidden"
                resizeHandles={["sw"]}
              >
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              </ResizableBox>
            </div>
          )}
        </section>
      </main>
    </div>
  );
  
  
}
