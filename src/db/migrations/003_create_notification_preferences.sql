-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    token_address TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    notify_position_change BOOLEAN DEFAULT true,
    notify_before_showcase BOOLEAN DEFAULT true,
    notify_on_turn BOOLEAN DEFAULT true,
    last_notified_position INTEGER,
    last_notified_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_address) REFERENCES token_submissions(token_address) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_notification_token_address ON notification_preferences(token_address);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();