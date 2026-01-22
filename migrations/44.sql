
-- Insert specialities master data
INSERT INTO specialities (name) VALUES
('Cardiology'),
('Radiology'),
('ICU / Critical Care'),
('Operation Theatre'),
('Laboratory'),
('Physiotherapy'),
('Dental'),
('NICU'),
('General Hospital'),
('ENT'),
('Orthopedics'),
('Urology'),
('Gynecology'),
('Homecare');

-- Insert products for Cardiology
INSERT INTO products (speciality_id, name) VALUES
(1, 'ECG machine'),
(1, 'TMT system'),
(1, 'Holter monitor'),
(1, 'Defibrillator'),
(1, 'Patient monitor'),
(1, 'Echo machine'),
(1, 'Pacemaker programmer'),
(1, 'Pulse oximeter');

-- Insert products for Radiology
INSERT INTO products (speciality_id, name) VALUES
(2, 'X-ray machine'),
(2, 'CR system'),
(2, 'DR panel'),
(2, 'C-arm'),
(2, 'Ultrasound scanner'),
(2, 'CT scanner'),
(2, 'MRI system'),
(2, 'Mammography machine'),
(2, 'Radiation PPE');

-- Insert products for ICU / Critical Care
INSERT INTO products (speciality_id, name) VALUES
(3, 'Ventilator'),
(3, 'Patient monitor'),
(3, 'Syringe pump'),
(3, 'Infusion pump'),
(3, 'Suction machine'),
(3, 'HFNC'),
(3, 'BiPAP/CPAP'),
(3, 'ICU beds'),
(3, 'Defibrillator');

-- Insert products for Operation Theatre
INSERT INTO products (speciality_id, name) VALUES
(4, 'OT lights'),
(4, 'OT table'),
(4, 'Anaesthesia workstation'),
(4, 'Electrocautery/ESU'),
(4, 'Diathermy'),
(4, 'Endoscopy tower'),
(4, 'Laparoscopy set'),
(4, 'Autoclave'),
(4, 'OR video system');

-- Insert products for Laboratory
INSERT INTO products (speciality_id, name) VALUES
(5, 'Biochemistry analyzer'),
(5, 'Hematology analyzer'),
(5, 'Electrolyte analyzer'),
(5, 'Coagulation analyzer'),
(5, 'CLIA/ELISA analyzer'),
(5, 'Urine analyzer'),
(5, 'Microscope'),
(5, 'Centrifuge'),
(5, 'Incubator'),
(5, 'PCR machine'),
(5, 'Blood culture system');

-- Insert products for Physiotherapy
INSERT INTO products (speciality_id, name) VALUES
(6, 'TENS'),
(6, 'Ultrasound therapy'),
(6, 'SWD'),
(6, 'Muscle stimulator'),
(6, 'Traction unit'),
(6, 'Laser therapy'),
(6, 'CPM machine'),
(6, 'Exercise rehab units');

-- Insert products for Dental
INSERT INTO products (speciality_id, name) VALUES
(7, 'Dental chair'),
(7, 'RVG sensor'),
(7, 'Portable X-ray'),
(7, 'Scaler'),
(7, 'Micromotor'),
(7, 'Light cure unit'),
(7, 'Compressor'),
(7, 'Suction motor'),
(7, 'Autoclave');

-- Insert products for NICU
INSERT INTO products (speciality_id, name) VALUES
(8, 'Infant incubator'),
(8, 'Radiant warmer'),
(8, 'Phototherapy'),
(8, 'Syringe/infusion pumps'),
(8, 'Neonatal ventilator'),
(8, 'Infant monitor'),
(8, 'CPAP'),
(8, 'Transport incubator');

-- Insert products for General Hospital
INSERT INTO products (speciality_id, name) VALUES
(9, 'Hospital beds'),
(9, 'Wheelchair'),
(9, 'Stretchers'),
(9, 'BP monitor'),
(9, 'Glucometer'),
(9, 'Nebulizer'),
(9, 'Suction'),
(9, 'Oxygen concentrator'),
(9, 'Flowmeter'),
(9, 'Exam light');

-- Insert products for ENT
INSERT INTO products (speciality_id, name) VALUES
(10, 'ENT workstation'),
(10, 'Endoscopy camera'),
(10, 'Nasal scope'),
(10, 'Otoscope'),
(10, 'Audiometer'),
(10, 'Tympanometer'),
(10, 'Light source');

-- Insert products for Orthopedics
INSERT INTO products (speciality_id, name) VALUES
(11, 'C-arm'),
(11, 'Plaster saw'),
(11, 'Traction equipment'),
(11, 'Surgical instruments'),
(11, 'Ortho drills'),
(11, 'Arthroscopy tower');

-- Insert products for Urology
INSERT INTO products (speciality_id, name) VALUES
(12, 'Uroflowmetry'),
(12, 'TURP unit'),
(12, 'Cystoscope'),
(12, 'Ureteroscope'),
(12, 'Lithotripter'),
(12, 'Endoscopy tower');

-- Insert products for Gynecology
INSERT INTO products (speciality_id, name) VALUES
(13, 'CTG machine'),
(13, 'Fetal doppler'),
(13, 'Ultrasound'),
(13, 'Colposcope'),
(13, 'Delivery table'),
(13, 'Vacuum extractor');

-- Insert products for Homecare
INSERT INTO products (speciality_id, name) VALUES
(14, 'Oxygen concentrator'),
(14, 'BiPAP/CPAP'),
(14, 'Pulse oximeter'),
(14, 'Nebulizer'),
(14, 'Wheelchair'),
(14, 'Homecare bed'),
(14, 'Suction'),
(14, 'Glucometer');
