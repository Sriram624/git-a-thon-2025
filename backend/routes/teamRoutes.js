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
      members
    } = req.body;

    if (!teamName || !teamLeaderName || !email) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Insert team
    const { data: team, error: teamError } = await supabase
      .from("teams_3")
      .insert({
        team_name: teamName,
        team_size: teamSize
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Insert leader
    await supabase.from("participants").insert({
      team_id: team.id,
      name: teamLeaderName,
      email,
      phone: phoneNumber,
      college,
      github: githubProfile,
      role: "leader"
    });

    // Insert members
    if (Array.isArray(members)) {
      const memberRows = members.map((m) => ({
        team_id: team.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        college: m.college,
        year: m.year,
        github: m.github,
        role: "member"
      }));

      await supabase.from("participants").insert(memberRows);
    }

    // Optional email
   await sendConfirmationEmail(leader.email, teamName);;


    res.status(201).json({
      message: "Team registered successfully",
      teamId: team.id
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      message: err.message || "Server error"
    });
  }
});

module.exports = router;
