/**
 * This file contains all the API calls to the backend server. It will be used in every page for authentication and other API calls.
 */

/**
 * The URL for redirecting users to the Google login page on the authentication page.
 * 
 * @constant {string}
 */
export const loginRedirectUrl = "/api/auth/login"; // will be used in auth page to redirect to google login page

/**
 * Fetches an authentication token from the backend API.
 * 
 * @async
 * @returns {Promise<Object|null>} The auth token response in JSON format, or null if an error occurs.
 */
export async function fetchAuthToken() {
  try {
    const response = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch auth token");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching auth token:", error);
    return null;
  }
}

/**
 * Logs out the current user by sending a request to the backend API to invalidate the session.
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function handleLogout() { //this function will handle logout
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // ✅ Include cookies in request to tell backend it's a logged-in user
  });
}

/**
 * Fetches user data by validating the token and returning the user information.
 * This function is used in pages for authentication.
 * 
 * @async
 * @returns {Promise<Object|null>} The user data if authenticated, or null if authentication fails.
 */
export async function fetchUser() {// this function will validate token and return user data and will be used in every page for authentication
  try {
    const response = await fetch("/api/auth/getUser", {
      method: "GET",
      credentials: "include", // ✅ Include cookies in request

      
    });
    if (!response.ok) {
      return null;
    }
    return await response.json()
  } catch (error) {
    // console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Updates the user profile data on the backend server.
 * 
 * @async
 * @param {Object} data - The user profile data to update.
 * @returns {Promise<Object|null>} The updated user profile data, or null if the update fails.
 */
export async function updateUser(data) { // this function will call frontend server to call backend to update user data in profile page
  try {
    const response = await fetch("/api/user/updateProfile", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include", // ✅ Ensures cookies are sent
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from Next.js API:", errorText);
      throw new Error("Failed to update user");
    }

    const result = await response.json();
    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

/**
 * Uploads an image file to the backend server.
 * 
 * @async
 * @param {File} file - The image file to be uploaded.
 * @returns {Promise<Object|null>} The uploaded image data (e.g., URL), or null if the upload fails.
 */
export async function uploadImage(file) { // this function specifically seperated in profile page to upload image.
  // console.log("Sending request to Next.js API:", file);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/user/uploadImage", {
      method: "POST",
      body: formData,
      credentials: "include", // ✅ Ensures cookies are sent
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return await response.json(); // Expected response: { url: "https://your-image-server.com/image.jpg" }
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
}

/**
 * Fetches the user's contact list from the backend API.
 * 
 * @async
 * @returns {Promise<Array|null>} The contact list, or null if the request fails.
 */
export async function fetchContacts() {// this function will validate token and return user data and will be used in every page for authentication
  try {
    const response = await fetch("/api/connections/getContacts", {
      method: "GET",
      credentials: "include", // ✅ Include cookies in request
    });

    if (!response.ok) {
      return null;
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Sends a contact request to add a user as a friend.
 * 
 * @async
 * @param {string} friendId - The ID of the user to add as a contact.
 * @returns {Promise<Object|null>} The result of the request, or null if it fails.
 */
export async function addContactRequest(friendId) { // this function used on random call page to allow users to add other user as friends
  try {
    const response = await fetch("/api/addContact", {
      method: "POST",
      body: JSON.stringify({ friendId }),
      credentials: "include", // ✅ Ensures cookies are sent
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to add contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error adding contact:", error);
    return null;
  }
}

/**
 * Accepts a contact request and adds the user to the contact list.
 * 
 * @async
 * @param {string} friendId - The ID of the friend to accept.
 * @returns {Promise<Object|null>} The result of the accept request, or null if it fails.
 */
export async function acceptContactRequest(friendId) {
  try {
    const response = await fetch("/api/connections/acceptContact", {
      method: "POST",
      body: JSON.stringify( {friendId} ),
      credentials: "include", // ✅ Ensures cookies are sent
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to accept contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error accepting contact:", error);
    return null;
  }
}

/**
 * Rejects a contact request.
 * 
 * @async
 * @param {string} friendId - The ID of the friend whose request is to be rejected.
 * @returns {Promise<Object|null>} The result of the reject request, or null if it fails.
 */
export async function rejectContactRequest(friendId) {
  try {
    const response = await fetch("/api/rejectContact", {
      method: "POST",
      body: JSON.stringify({ friendId }),
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to reject contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error rejecting contact:", error);
    return null;
  }
}


/**
 * Inserts a message into the backend database and sends it to the recipient.
 * 
 * @async
 * @param {string} messageText - The content of the message.
 * @param {string} senderId - The ID of the message sender.
 * @param {string} receiverId - The ID of the message receiver.
 * @returns {Promise<Object|null>} The result of the message insert operation, or null if it fails.
 */
export async function insertMessage(messageText, senderId, receiverId) {
  try {
    const response = await fetch("/api/message/addMessage", {
      method: "POST",
      body: JSON.stringify({ messageText, senderId, receiverId }),
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to insert message.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error inserting message:", error);
    return null;
  }
}

/**
 * Fetches all messages between the current user and others.
 * 
 * @async
 * @returns {Promise<Array|null>} The list of messages, or null if fetching fails.
 */
export async function fetchMessages() {
  try {
    const response = await fetch("/api/message/getMessages", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
}

/**
 * Logs the start of a call between two users.
 * 
 * @async
 * @param {string} callerId - The ID of the calling user.
 * @param {string} calleeId - The ID of the user being called.
 * @param {string} callType - The type of call (e.g., "video", "voice").
 * @returns {Promise<Response|null>} The response from the backend or null if an error occurs.
 */
export async function logStartCall(callerId, calleeId, callType) {
  try{
    console.log("CallerId: ", callerId);
    console.log("CalleeId: ", calleeId);
    const response = await fetch("/api/logs/startCall", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ callerId, calleeId, callType }),
    });

    if (!response.ok) {
      throw new Error("Invalid session");
    }

    return response;
  }
  catch (error) {
    console.error("User fetch error:", error);
    return null;
  }
}

/**
 * Logs the end of a call between two users.
 * 
 * @async
 * @param {string} callerId - The ID of the calling user.
 * @param {string} calleeId - The ID of the user who was called.
 * @returns {Promise<Response|null>} The response from the backend or null if an error occurs.
 */
export async function logEndCall(callerId, calleeId) {
  try{
    const response = await fetch("/api/logs/endCall", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ callerId, calleeId }),
    });

    if (!response.ok) {
      throw new Error("Invalid session");
    }

    return response;
  }
  catch (error) {
    console.error("User fetch error:", error);
    return null;
  }
}


