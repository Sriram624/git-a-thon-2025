const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { sendConfirmationEmail } = require("../email");

/**
 * Health check
 */
router.get("/test", (req, res) => {
  res.send("Team routes are working!");
});

/**
 * Register team
 */
router.post("/register", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const {
      teamName,
      teamLeaderName,
      email,
      phoneNumber,
      college,
      githubProfile,
      teamSize,
      members
    } = req.body;

    // Basic validation
    if (!teamName || !teamLeaderName || !email) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    /**
     * 1️⃣ Insert team
     */
    const { data: team, error: teamError } = await supabase
      .from("teams_3")
      .insert({
        team_name: teamName,
        team_size: teamSize
      })
      .select()
      .single();

    if (teamError) {
      console.error("Team insert error:", teamError);
      throw teamError;
    }

    /**
     * 2️⃣ Build participants array
     */
    const participants = [
      {
        team_id: team.id,
        name: teamLeaderName,
        email: email,
        phone: phoneNumber,
        college: college,
        year: "N/A",                 // ✅ REQUIRED (NOT NULL FIX)
        github: githubProfile,
        role: "leader"
      }
    ];

    if (Array.isArray(members)) {
      members.forEach((m) => {
        participants.push({
          team_id: team.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          college: m.college,
          year: m.year || "N/A",      // ✅ REQUIRED
          github: m.github,
          role: "member"
        });
      });
    }

    /**
     * 3️⃣ Insert participants
     */
    const { error: participantError } = await supabase
      .from("participants")
      .insert(participants);

    if (participantError) {
      console.error("Participant insert error:", participantError);
      throw participantError;
    }

    /**
     * 4️⃣ Respond immediately (DO NOT BLOCK)
     */
    res.status(201).json({
      message: "Team registered successfully",
      teamId: team.id
    });

    /**
     * 5️⃣ Send email asynchronously (SMTP may timeout on Render — OK)
     */
    sendConfirmationEmail(email, req.body)
      .then(() => console.log("Email sent"))
      .catch(err => console.error("Email failed:", err));

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      message: err.message || "Server error"
    });
  }
});

module.exports = router;
