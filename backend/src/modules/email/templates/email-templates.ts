export const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to English Learning Platform!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi <strong>{{name}}</strong>,</p>
    <p>Thank you for joining English Learning Platform! We're excited to help you on your English learning journey.</p>
    <p>Here's what you can do to get started:</p>
    <ul>
      <li>Set your daily learning goal</li>
      <li>Start with our vocabulary flashcards</li>
      <li>Take your first quiz to assess your level</li>
      <li>Join our community and compete on the leaderboard</li>
    </ul>
    {{#if verificationUrl}}
    <p>Please verify your email by clicking the button below:</p>
    <a href="{{verificationUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Verify Email</a>
    {{/if}}
    <p>Start learning today!</p>
    <p>Best regards,<br>The English Learning Team</p>
  </div>
</body>
</html>
`;

export const passwordResetTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Password Reset Request</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi <strong>{{name}}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="{{resetUrl}}" style="display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
    {{#if expiresInMinutes}}
    <p style="color: #666; font-size: 14px;">This link will expire in {{expiresInMinutes}} minutes.</p>
    {{/if}}
    <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
    <p>Best regards,<br>The English Learning Team</p>
  </div>
</body>
</html>
`;

export const weeklyReportTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Your Weekly Learning Report</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi <strong>{{name}}</strong>,</p>
    <p>Here's your learning summary for this week:</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 10px 0;">XP Earned</td>
          <td style="text-align: right; font-weight: bold; color: #667eea;">{{stats.xpEarned}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Words Learned</td>
          <td style="text-align: right; font-weight: bold; color: #667eea;">{{stats.wordsLearned}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Quizzes Completed</td>
          <td style="text-align: right; font-weight: bold; color: #667eea;">{{stats.quizzesCompleted}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Study Time</td>
          <td style="text-align: right; font-weight: bold; color: #667eea;">{{stats.studyMinutes}} min</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #eee;">Current Streak</td>
          <td style="text-align: right; font-weight: bold; color: #f5576c; border-top: 1px solid #eee;">{{stats.streakDays}} days</td>
        </tr>
      </table>
    </div>
    <p>Keep up the great work! See you next week.</p>
    <p>Best regards,<br>The English Learning Team</p>
  </div>
</body>
</html>
`;

export const streakReminderTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streak Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Don't Break Your Streak!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi <strong>{{name}}</strong>,</p>
    <p>You have a <strong>{{streakDays}} day streak</strong> going! Don't let it end.</p>
    <p>Spend just 5 minutes today to keep your streak alive.</p>
    <a href="{{appUrl}}" style="display: inline-block; background: #fa709a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Start Learning</a>
    <p>Best regards,<br>The English Learning Team</p>
  </div>
</body>
</html>
`;

export const achievementTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Achievement Unlocked!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">🏆 Achievement Unlocked!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
    <p>Congratulations <strong>{{name}}</strong>!</p>
    <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 48px; margin: 0;">🏅</p>
      <h2 style="color: #667eea; margin: 10px 0;">{{achievementName}}</h2>
      <p style="color: #666;">{{achievementDescription}}</p>
    </div>
    <p>Keep learning and unlock more achievements!</p>
    <p>Best regards,<br>The English Learning Team</p>
  </div>
</body>
</html>
`;
