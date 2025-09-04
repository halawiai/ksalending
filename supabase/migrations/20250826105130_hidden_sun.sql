/*
  # Fraud Detection System Tables

  1. New Tables
    - `fraud_indicators` - Individual fraud indicators detected
    - `fraud_assessments` - Overall fraud assessment results
    - `fraud_cases` - Fraud cases for investigation
    - `blacklist` - Blocked entities
    - `device_fingerprints` - Device fingerprinting data
    - `geolocation_history` - Location tracking for impossible travel detection
    - `partner_metrics` - Partner API usage metrics

  2. Security
    - Enable RLS on all fraud-related tables
    - Add policies for fraud analysts and admins
    - Restrict access based on user roles

  3. Indexes
    - Add performance indexes for common queries
    - Optimize for real-time fraud detection
*/

-- Fraud Indicators Table
CREATE TABLE IF NOT EXISTS fraud_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  indicator_type text NOT NULL CHECK (indicator_type IN ('velocity', 'device', 'geolocation', 'behavioral', 'identity', 'financial', 'document')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  confidence decimal(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence jsonb NOT NULL DEFAULT '{}',
  detected_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_positive')),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fraud Assessments Table
CREATE TABLE IF NOT EXISTS fraud_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence decimal(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  indicator_count integer NOT NULL DEFAULT 0,
  recommended_action text NOT NULL CHECK (recommended_action IN ('approve', 'review', 'reject', 'block')),
  processing_time_ms integer NOT NULL DEFAULT 0,
  model_version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now()
);

-- Fraud Cases Table
CREATE TABLE IF NOT EXISTS fraud_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  indicator_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Blacklist Table
CREATE TABLE IF NOT EXISTS blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  reason text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Device Fingerprints Table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  fingerprint_hash text NOT NULL,
  fingerprint_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Geolocation History Table
CREATE TABLE IF NOT EXISTS geolocation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  country text NOT NULL,
  region text,
  city text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  created_at timestamptz DEFAULT now()
);

-- Partner Metrics Table
CREATE TABLE IF NOT EXISTS partner_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  total_requests integer NOT NULL DEFAULT 0,
  successful_requests integer NOT NULL DEFAULT 0,
  failed_requests integer NOT NULL DEFAULT 0,
  average_response_time decimal(8,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, date)
);

-- API Audit Logs Table (if not exists)
CREATE TABLE IF NOT EXISTS api_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id),
  endpoint text NOT NULL,
  method text NOT NULL,
  entity_id uuid REFERENCES entities(id),
  ip_address inet,
  user_agent text,
  status text NOT NULL,
  response_time integer DEFAULT 0,
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Data Cache Table for external API responses
CREATE TABLE IF NOT EXISTS data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, data_type)
);

-- User Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'entity_user' CHECK (role IN ('admin', 'analyst', 'viewer', 'entity_user')),
  entity_id uuid REFERENCES entities(id),
  entity_type text CHECK (entity_type IN ('individual', 'company', 'institution')),
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fraud_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE geolocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Fraud Indicators
CREATE POLICY "Fraud analysts can read all fraud indicators"
  ON fraud_indicators FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Fraud analysts can insert fraud indicators"
  ON fraud_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Fraud analysts can update fraud indicators"
  ON fraud_indicators FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for Fraud Assessments
CREATE POLICY "Fraud analysts can read all fraud assessments"
  ON fraud_assessments FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "System can insert fraud assessments"
  ON fraud_assessments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Fraud Cases
CREATE POLICY "Fraud analysts can manage fraud cases"
  ON fraud_cases FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for Blacklist
CREATE POLICY "Fraud analysts can manage blacklist"
  ON blacklist FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for Device Fingerprints
CREATE POLICY "System can manage device fingerprints"
  ON device_fingerprints FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for Geolocation History
CREATE POLICY "System can manage geolocation history"
  ON geolocation_history FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for Partner Metrics
CREATE POLICY "Partners can read their own metrics"
  ON partner_metrics FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE id = partner_id
    )
    OR
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for API Audit Logs
CREATE POLICY "Partners can read their own audit logs"
  ON api_audit_logs FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE id = partner_id
    )
    OR
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON api_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Data Cache
CREATE POLICY "System can manage data cache"
  ON data_cache FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for User Profiles
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all user profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'admin'
    )
  );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fraud_indicators_entity_id ON fraud_indicators(entity_id);
CREATE INDEX IF NOT EXISTS idx_fraud_indicators_detected_at ON fraud_indicators(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_indicators_severity ON fraud_indicators(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_indicators_status ON fraud_indicators(status);

CREATE INDEX IF NOT EXISTS idx_fraud_assessments_entity_id ON fraud_assessments(entity_id);
CREATE INDEX IF NOT EXISTS idx_fraud_assessments_created_at ON fraud_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_assessments_risk_level ON fraud_assessments(risk_level);

CREATE INDEX IF NOT EXISTS idx_fraud_cases_status ON fraud_cases(status);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_priority ON fraud_cases(priority);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_assignee ON fraud_cases(assignee);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_created_at ON fraud_cases(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blacklist_entity_id ON blacklist(entity_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_expires_at ON blacklist(expires_at);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_entity_id ON device_fingerprints(entity_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);

CREATE INDEX IF NOT EXISTS idx_geolocation_history_entity_id ON geolocation_history(entity_id);
CREATE INDEX IF NOT EXISTS idx_geolocation_history_created_at ON geolocation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_metrics_partner_id ON partner_metrics(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_metrics_date ON partner_metrics(date DESC);

CREATE INDEX IF NOT EXISTS idx_api_audit_logs_partner_id ON api_audit_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_created_at ON api_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_ip_address ON api_audit_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_data_cache_entity_id ON data_cache(entity_id);
CREATE INDEX IF NOT EXISTS idx_data_cache_expires_at ON data_cache(expires_at);

-- Functions for partner usage tracking
CREATE OR REPLACE FUNCTION increment_partner_usage(partner_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO partner_metrics (partner_id, total_requests, successful_requests, date)
  VALUES (partner_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (partner_id, date)
  DO UPDATE SET 
    total_requests = partner_metrics.total_requests + 1,
    successful_requests = partner_metrics.successful_requests + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM data_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired blacklist entries
CREATE OR REPLACE FUNCTION clean_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM blacklist WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;