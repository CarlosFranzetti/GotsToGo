-- Create bathrooms table
CREATE TABLE public.bathrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Accessibility features
  wheelchair_accessible BOOLEAN DEFAULT false,
  changing_table BOOLEAN DEFAULT false,
  step_free_entry BOOLEAN DEFAULT false,
  gender_neutral BOOLEAN DEFAULT false,
  
  -- Opening hours
  is_24_7 BOOLEAN DEFAULT false,
  opening_hours JSONB, -- Store hours as {monday: "9:00-17:00", tuesday: "9:00-17:00", etc}
  
  -- Additional info
  description TEXT,
  requires_key BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  rating DECIMAL(2, 1),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bathrooms ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read bathrooms (public data)
CREATE POLICY "Bathrooms are viewable by everyone" 
ON public.bathrooms 
FOR SELECT 
USING (true);

-- Create index for location-based queries
CREATE INDEX idx_bathrooms_location ON public.bathrooms(latitude, longitude);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bathrooms_updated_at
BEFORE UPDATE ON public.bathrooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for NYC
INSERT INTO public.bathrooms (name, address, latitude, longitude, wheelchair_accessible, changing_table, step_free_entry, gender_neutral, is_24_7, opening_hours, description, verified, rating) VALUES
('Starbucks - Times Square', '1585 Broadway, New York, NY 10036', 40.758896, -73.985130, true, true, true, true, false, '{"monday": "6:00-23:00", "tuesday": "6:00-23:00", "wednesday": "6:00-23:00", "thursday": "6:00-23:00", "friday": "6:00-23:00", "saturday": "7:00-23:00", "sunday": "7:00-23:00"}', 'Clean facilities, customer code required', true, 4.2),
('Bryant Park Restrooms', '42nd St & 6th Ave, New York, NY 10018', 40.753596, -73.983233, true, true, true, true, false, '{"monday": "7:00-19:00", "tuesday": "7:00-19:00", "wednesday": "7:00-19:00", "thursday": "7:00-19:00", "friday": "7:00-19:00", "saturday": "7:00-19:00", "sunday": "7:00-19:00"}', 'Public park restrooms, well-maintained', true, 4.5),
('Grand Central Terminal', '89 E 42nd St, New York, NY 10017', 40.752726, -73.977229, true, true, true, false, true, null, 'Multiple locations throughout terminal, always accessible', true, 4.0),
('Brooklyn Public Library', '10 Grand Army Plaza, Brooklyn, NY 11238', 40.672528, -73.968286, true, true, true, true, false, '{"monday": "9:00-20:00", "tuesday": "9:00-20:00", "wednesday": "9:00-20:00", "thursday": "9:00-20:00", "friday": "9:00-18:00", "saturday": "9:00-18:00", "sunday": "13:00-17:00"}', 'Library facilities, clean and accessible', true, 4.3),
('Washington Square Park', 'Washington Square, New York, NY 10012', 40.730823, -73.997332, true, false, true, true, false, '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-20:00", "sunday": "8:00-20:00"}', 'Public park restrooms', true, 3.8);