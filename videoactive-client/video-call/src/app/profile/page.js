"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, updateUser, uploadImage } from "../services/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(true);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); // Local preview
  const [imageFile, setImageFile] = useState(null); // File to send
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUser().then((info) => {
      console.log(info)
      if (!info) {
        router.push("/auth");
      } else {
        console.log("fetch data:" + info.message )
        setUser(info.user);
        setEmail(info.user.email);
        setName(info.user.username || "");
        setGender(info.user.gender ?? true);
        setDescription(info.user.description || "");
        setImage(info.user.profilePic || 'https://my-video-active-bucket.s3.amazonaws.com/videoCall/user/profile_default.jpg');
      }
      setLoading(false);
    });
  }, []);
  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert("Only PNG and JPEG files are allowed.");
        return;
      }
      const imageURL = URL.createObjectURL(file);
      setImage(imageURL);
      setImageFile(file);
    }
  };

  const handleUpdateUser = async () => {
    setUpdating(true);

    if (
      name === user.username &&
      gender === user.gender &&
      description === user.description &&
      !imageFile
    ) {
      alert("No changes detected.");
      setUpdating(false);
      return;
    }

    let imageUrl = user.profilePic;

    if (imageFile) {
      const uploadResponse = await uploadImage(imageFile);
      if (uploadResponse?.imageUrl) {
        imageUrl = uploadResponse.imageUrl;
        setImage(imageUrl);
      } else {
        alert("Failed to upload image.");
        setUpdating(false);
        return;
      }
    }

    const response = await updateUser({ username: name, gender, description, image: imageUrl });
    if (response?.message === "success" && response.user) {
      alert("Profile updated successfully!");
      setUser(response.user); // ✅ Update user directly from response
      setName(response.user.username || "");
      setGender(response.user.gender ?? true); 
      setDescription(response.user.description || "");
    } else {
      alert("Failed to update profile.");
    }

    setUpdating(false);
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen text-pink-500">Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center px-10 py-10">
        <div className="bg-white shadow-lg rounded-lg p-6 flex gap-8 w-full max-w-3xl py-10 my-10">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-500 mb-2 text-center">
              Please upload a profile image that below 400x400 pixels.
            </div>

            <div className="w-40 h-40 bg-gray-300 flex items-center justify-center rounded-lg overflow-hidden relative">
              {image ? (
                <img src={image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500">No Image</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Profile Form */}
          <div className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>

            <div>
              <label className="text-gray-600 font-medium">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-gray-600 font-medium">Email:</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border border-gray-300 rounded-lg text-gray-900 px-3 py-2 mt-1 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-600 font-medium">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value === "true")}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              >
                <option value={true}>Male</option>
                <option value={false}>Female</option>
              </select>
            </div>

            <div>
              <label className="text-gray-600 font-medium">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
                rows="3"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleUpdateUser}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
