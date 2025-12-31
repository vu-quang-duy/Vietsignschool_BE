const db = require('../db');

// GET user/profile

async function getProfile(req, res) {
    try {
        const userId = req.user?.user_id ;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const [rows] = await db.query(
            'SELECT user_id, name, email, phone_number, code, is_deleted, is_oauth2, created_by, created_date, modified_by, modified_date FROM `user` WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (rows.length === 0){
            return res.status(404).json({message: "User not found"});
        }

        const user = rows[0];
        return res.json({user});
    }
    catch (error){
        console.error('Error fetching user profile:', error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}

// Update user/profile
async function updateProfile(req, res){
    try {
        const userId = req.user?.user_id;
        if(!userId){
            return res.status(401).json({message: "Unauthorized"});
        }

        const {
            name,
            email,
            phone_number,
            gender,
            address,
            avatar_location,
            birth_day,
            code,
            school_id
        }
        = req.body;


        await db.query(
            `UPDATE user
            SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone_number = COALESCE(?, phone_number),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                avatar_location = COALESCE(?, avatar_location),
                birth_day = COALESCE(?, birth_day),
                code = COALESCE(?, code),
                school_id = COALESCE(?, school_id),
                modified_by = ?,
                modified_date = NOW()
            WHERE user_id = ? AND is_deleted = 0`,
            [
                name || null,
                email || null,
                phone_number || null,
                gender || null,
                address || null,
                avatar_location || null,
                birth_day || null,
                code || null,
                school_id || null,
                req.user?.email || 'anonymousUser',
                userId
            ]
            );
        return  res.json({message:"Profile updated successfully: ", updatedProfile: req.body});

    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}

module.exports = { 
    getProfile,
    updateProfile
 };