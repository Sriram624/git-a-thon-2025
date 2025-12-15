const fs = require("fs");
const path = require("path");

async function sendConfirmationEmail(to, data) {
  const templatePath = path.join(__dirname, "templates", "email.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  const { teamName, teamSize, members = [] } = data;

  const replacements = {
    teamName,
    teamSize,
    leaderName: data.teamLeaderName,
    leaderEmail: data.email,
    leaderPhone: data.phoneNumber,
    leaderCollege: data.college,
    leaderGithub: data.githubProfile,

    member2Name: members[0]?.name,
    member2Email: members[0]?.email,
    member2Phone: members[0]?.phone,
    member2College: members[0]?.college,
    member2Year: members[0]?.year,
    member2Github: members[0]?.github,

    member3Name: members[1]?.name,
    member3Email: members[1]?.email,
    member3Phone: members[1]?.phone,
    member3College: members[1]?.college,
    member3Year: members[1]?.year,
    member3Github: members[1]?.github,

    member4Name: members[2]?.name,
    member4Email: members[2]?.email,
    member4Phone: members[2]?.phone,
    member4College: members[2]?.college,
    member4Year: members[2]?.year,
    member4Github: members[2]?.github,
  };

  for (const key in replacements) {
    html = html.replace(
      new RegExp(`{{${key}}}`, "g"),
      replacements[key] || "-"
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GIT-A-THON <onboarding@resend.dev>",
      to,
      subject: "GIT-A-THON 2025 – Registration Confirmed",
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

module.exports = { sendConfirmationEmail };
