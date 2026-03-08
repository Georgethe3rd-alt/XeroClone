# Heartbeat Tasks for Scout

Run these checks every 30 minutes (or as configured):

## 1. Email Check
- Look for unread urgent/flagged emails
- Report sender, subject if urgent
- Ignore newsletters, automated emails

## 2. Calendar Check  
- Check next 2 hours for events
- Report upcoming meetings/appointments
- Note if conflict or running late

## 3. Notification Scan
- Check for important alerts
- System notifications, mentions, etc.

## Output Format

If urgent items found:
```
📧 Email: 1 urgent from wayne@wipay.com - "Payment processor down"
📅 Calendar: Team standup in 45 minutes
```

If nothing urgent:
```
HEARTBEAT_OK
```

Keep it brief. George will handle the details.
