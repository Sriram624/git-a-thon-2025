const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { sendConfirmationEmail } = require("../email");

router.get("/test", (req, res) => {
  res.send("Team routes are working!");
});

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
      problemPreference,
      members
    } = req.body;

    if (!teamName || !teamLeaderName || !email) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // 1️⃣ Insert team
    const { data: team, error: teamError } = await supabase
      .from("teams_3")
      .insert({
        team_name: teamName,
        team_size: teamSize,
        problem_preference: problemPreference
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // 2️⃣ Prepare participants
    const participants = [
      {
        team_id: team.id,
        name: teamLeaderName,
        email,
        phone: phoneNumber,
        college,
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
          year: m.year,
          github: m.github,
          role: "member"
        });
      });
    }

    // 3️⃣ Insert participants
    const { error: participantError } = await supabase
      .from("participants")
      .insert(participants);

    if (participantError) {
      if (participantError.code === "23505") {
        return res.status(400).json({
          message: "One or more participant emails are already registered"
        });
      }
      throw participantError;
    }

    // 4️⃣ Send confirmation email
    await sendConfirmationEmail(email, req.body);

    return res.status(201).json({
      message: "Team registered successfully",
      teamId: team.id
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      message: err.message || "Server error"
    });
  }
});

module.exports = router;
