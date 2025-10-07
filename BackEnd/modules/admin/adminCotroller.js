
import admin from "../../config/fireBaseAdmin.js";


export const getAdminUsers = async (req, res) => {
  try {
    const adminUsers = [];
    let nextPageToken;

    // Firebase lists users in batches of 1000
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

      listUsersResult.users.forEach((userRecord) => {
        const claims = userRecord.customClaims || {};
        if (claims.role === "admin") {
          adminUsers.push({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || null,
            role: claims.role,
          });
        }
        
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    return res.status(200).json({
      count: adminUsers.length,
      admins: adminUsers,
    });
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Internal server error" });
  }
};



// ✅ Add Admin Role
export const addAdminRole = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required" });
    }

    // Get current custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Set or update the role
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      role: "admin",
    });

    console.log(`✅ Admin role added for user ${uid}`);
    return res.status(200).json({ message: "Admin role added successfully" });
  } catch (error) {
    console.error("❌ Error adding admin role:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
};

// ✅ Remove Admin Role
export const removeAdminRole = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required" });
    }

    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Remove the admin role if it exists
    const updatedClaims = { ...currentClaims };
    if (updatedClaims.role === "admin") {
      delete updatedClaims.role;
    }

    await admin.auth().setCustomUserClaims(uid, updatedClaims);

    console.log(`🟡 Admin role removed for user ${uid}`);
    return res.status(200).json({ message: "Admin role removed successfully" });
  } catch (error) {
    console.error("❌ Error removing admin role:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
};
