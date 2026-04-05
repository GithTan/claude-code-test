-- Add contact columns
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Import all active projects from FIEC PROJECT tracker
INSERT INTO ops_projects (project_name, pic, address, specs, unit_label, s_o_f, subcon, status, concerns, contact_person, contact_number) VALUES

-- YASHANO MALL (3 units)
('YASHANO MALL', 'VIC', 'SORSOGON', '1600 KG / PASSENGER ELEVATOR', 'PE1', '6/6/6', 'ELIZARDO', 'awaiting_shaft_readiness', 'On-going construction of 5F. For checking of beam spacing & door opening. For clearing and dewatering of elevator pit. For compliance of pit elevation.', 'ENGR. BIANCA', '09212925000'),
('YASHANO MALL', 'VIC', 'SORSOGON', 'SERVICE ELEVATOR', 'SE1', '4/4/4', 'ELIZARDO', 'awaiting_shaft_readiness', 'For minimal chipping by gencon. For compliance of pit elevation. Templating (03/11). Awaiting rectification of I-beam at overhead for machine bed.', 'ENGR. BIANCA', '09212925000'),
('YASHANO MALL', 'VIC', 'SORSOGON', 'SERVICE ELEVATOR', 'SE2', NULL, 'ELIZARDO', 'awaiting_shaft_readiness', 'For minimal chipping by gencon. For compliance of pit elevation. Templating (03/11). Awaiting rectification of I-beam at overhead for machine bed.', 'ENGR. BIANCA', '09212925000'),

-- DOWN SYNDROME (BICOL REGIONAL)
('DOWN SYNDROME', 'VIC', 'BICOL REGIONAL HOSPITAL AND MEDICAL CENTER', '450 KG / PASSENGER ELEVATOR', 'PE1', '5/3/5', 'VENER', 'unit_delivered_awaiting_shaft', 'On-going construction. For checking of hook layout. Clearing and dewatering of pit. For compliance of pit elevation. Target installation TBD.', 'ENGR. RUSSEL', '09270458245'),

-- HONG RESIDENCE (NAGA)
('HONG RESIDENCE (NAGA)', 'VIC', 'VILLA CONCEPTION SUBD., NAGA CITY', '550 KG / PASSENGER ELEVATOR', 'PE1', '3/3/3', NULL, 'awaiting_shaft_readiness', 'On-going construction of perimeter beams & door headers. Unit has arrived at port (02/25). Unit delivered (03/11).', 'ENGR. RONNIE', '09771497559'),

-- NAGA DIALYSIS
('NAGA DIALYSIS', 'VIC', 'DIVERSION RD. ROXAS AVE., NAGA CITY', '1000 KG / PASSENGER ELEVATOR', 'PE1', '3/3/3', NULL, 'awaiting_shaft_readiness', 'On-going construction of elevator shaft. For compliance of pit elevation. For checking of opening details and hook details.', 'ENGR DAN', '09614869649'),

-- NGCP LAPU-LAPU
('NGCP LAPU-LAPU', 'VIC', 'M.L. QUEZON NATIONAL HWY, PUSOK, LAPU LAPU', '2000 KG / PASSENGER ELEVATOR', 'PE1', '5/5/5', 'CHESTER', 'unit_delivered_awaiting_shaft', 'On-going compliance of pit elevation. For checking of machine room pedestal upon template setting. Landing door to be set before door openings are finished. Template target date March 20.', 'ENGR JESTONI', '09859503514'),

-- NGCP MANDAUE
('NGCP MANDAUE', 'VIC', 'SITIO TAMBI, MANDAUE, CEBU', '2000 KG / PASSENGER ELEVATOR', 'PE1', '5/5/5', 'CHESTER', 'unit_delivered_awaiting_shaft', 'Construction suspended due to structural issues. Currently on 4F construction. Delivered.', 'ENGR JESTONI', '09859503514'),

-- PAGODA (2 units)
('PAGODA', 'VIC', 'MAITIM, TAGAYTAY', '800 KG / PASSENGER ELEVATOR', 'PE1', NULL, NULL, 'unit_delivered_awaiting_shaft', 'Additional floor for confirmation. On-going construction of perimeter beams. For confirmation of machine blockout elevation.', 'SIR DEXTER', 'Via Messenger'),
('PAGODA', 'VIC', 'MAITIM, TAGAYTAY', '450 KG / PASSENGER ELEVATOR', 'PE2', NULL, NULL, 'unit_delivered_awaiting_shaft', NULL, 'SIR DEXTER', 'Via Messenger'),

-- HIGHTOWER
('HIGHTOWER', 'VIC', 'SEACOM COMPOUND, SAN ANTONIO, PARAÑAQUE', '3000 KG / PASSENGER ELEVATOR', 'PE1', '9/9/9', 'VENER', 'unit_delivered_awaiting_shaft', 'On-going construction of elevator slab for hoisting hook. On-going installation of perimeter beams. For clearing and dewatering of elevator pit. On-going installation of door opening.', 'FOREMAN JM', '09759937334'),

-- NGCP Taguig Substation
('NGCP TAGUIG SUBSTATION', 'VIC', NULL, NULL, NULL, NULL, NULL, 'awaiting_shaft_readiness', 'Done construction of pedestal extension. Awaiting finishing of door opening. Awaiting breaker installation. Angle bar support proposal pending. Awaiting civil works.', NULL, NULL),

-- Ignacio Clinic
('IGNACIO CLINIC', 'VIC', NULL, NULL, NULL, NULL, NULL, 'for_unloading', 'For Unloading.', NULL, NULL),

-- MAKATI (Otis)
('MAKATI (Otis)', 'Jonathan', NULL, '630 KG / MRL', NULL, '6', NULL, 'mechanical_installation', NULL, 'Engr. Mark', '09676600000'),

-- La Pensar Resort
('LA PENSAR RESORT', 'Jonathan', NULL, NULL, NULL, NULL, NULL, 'for_delivery', 'For Shipment; ETA Feb 28. Shaft ready (03/25/26).', NULL, NULL),

-- J.Luna
('J.LUNA', 'VIC', 'J. Luna St., Pasay', 'HYDRAULIC 400 KG', NULL, '4', 'JOEREY', 'awaiting_shaft_readiness', 'Ongoing shaft construction. For Delivery 3/21.', NULL, NULL),

-- St. Paul College (Convent)
('ST. PAUL COLLEGE (CONVENT)', 'Jonathan', 'Parañaque', '400 KG / HYDRAULIC', NULL, '2', NULL, 'on_going_production', 'On going production of unit.', 'Sister Nena', '9955366294'),

-- St. Paul College (Main Building)
('ST. PAUL COLLEGE (MAIN BUILDING)', 'Jonathan', 'Parañaque', '400 KG / HYDRAULIC', NULL, '4', NULL, 'on_going_production', 'On going production of unit.', 'Sister Nena', '9955366294'),

-- Westwind Bataan
('WESTWIND BATAAN', 'VIC', 'Morong, Bataan', '6-8 PERSONS', 'PE1', '3', NULL, 'awaiting_shaft_readiness', 'For final confirmation of shaft with I-beams.', NULL, NULL),

-- NKTI
('NKTI', 'Jonathan', 'East Ave., QC', '1000 KG / PASSENGER ELEVATOR', '4 units', '11', NULL, 'awaiting_shaft_readiness', 'On-going shaft construction. Construction suspended.', NULL, NULL),

-- ST. DOMINIC
('ST. DOMINIC', 'Jonathan', 'Fairview, QC', '1000 KG / PASSENGER ELEVATOR', 'PE1', '8', 'VENER', 'unit_delivered_awaiting_shaft', 'Ongoing shaft construction at 7th floor. Unit delivered.', NULL, NULL),

-- JIMMY ONG
('JIMMY ONG', 'Jonathan', '71 V. Luna Ave., Quezon City', '1000 KG / PASSENGER ELEVATOR', 'PE1', '5/5/5', NULL, 'awaiting_shaft_readiness', 'Awaiting payment to proceed delivery. For inspection of overhead and hook placement. For clearing and dewatering of elevator pit. Delivered (03/12). For bidding.', 'SIR JIMMY', '9178615527'),

-- SPD BLDG
('SPD BLDG', 'Jonathan', '71A Kamias Rd., Quezon City', '1000 KG / PASSENGER ELEVATOR', 'PE1', '5/5/5', NULL, 'on_going_production', 'On-going equipment production. Existing unit for dismantling. For Shipment.', 'MS REMY', NULL),

-- ST JOSEPH ST.
('ST JOSEPH ST.', 'CHEL', 'St. Joseph Ville, San Juan City', '400 KG / HYDRAULIC', 'PE1', NULL, NULL, 'on_going_production', 'On-going equipment production. For pit excavation based on requirement.', 'ENGR POLANCO', '09913379068'),

-- COLUMBIA
('COLUMBIA', 'CHEL', 'J. Lianes Escoda, San Rafael Village, Navotas', '2000 KG / PASSENGER ELEVATOR', 'PE1', '4/4/4', NULL, 'on_going_production', 'Excavation of foundation expected Feb 25. Some crates delivered Feb 24, remaining for shipment ETA Feb 28.', 'ENGR MELANIE', '09173123707'),

-- AYALA GREENBELT
('AYALA GREENBELT', 'CHEL', 'Legazpi St., Makati City', '2000 KG / SERVICE ELEVATOR', 'PE1', '5/5/5', 'ERNANIE', 'for_delivery', 'For Delivery March 12. Board-up Installation March 12.', 'ENGR LUIGI', '09455511442'),

-- LTO - FTI
('LTO - FTI', 'CHEL', 'FTI, Alabang', 'ESCALATOR', NULL, NULL, 'ELIZARDO', 'for_delivery', 'For confirmation of measurements. For checking of civil, electrical, fire pro works. Delivered (03/17). PTI permit. March 30-31 audit of delivered components. By April can proceed to install.', NULL, NULL),

-- Jem Res
('JEM RES', NULL, NULL, NULL, 'PE1, PE2, PE3', NULL, NULL, 'awaiting_shaft_readiness', 'On-going shaft construction.', NULL, NULL),

-- DSWD
('DSWD', NULL, NULL, NULL, NULL, NULL, NULL, 'awaiting_shaft_readiness', 'Ongoing inventory (Jan 7, 2026).', NULL, NULL),

-- Paragas Project
('PARAGAS PROJECT', 'VIC', NULL, NULL, NULL, '8/8/8', NULL, 'awaiting_shaft_readiness', 'Ongoing shaft construction.', NULL, NULL),

-- Ayala Greenfield (Gundry Residences)
('AYALA GREENFIELD (GUNDRY RESIDENCES)', NULL, 'Calamba, Laguna', NULL, NULL, NULL, NULL, 'for_delivery', 'Target date of delivery on or before March 13, 2026.', NULL, NULL),

-- Master Siomai
('MASTER SIOMAI', 'VIC', 'Malabon', '400 KG / HYDRAULIC', NULL, '4/4/4', NULL, 'for_delivery', 'For Shipment; ETA Feb 28. Shaft ready. For Bidding.', NULL, NULL),

-- BJMP
('BJMP', NULL, NULL, NULL, NULL, NULL, NULL, 'awaiting_shaft_readiness', NULL, NULL, NULL),

-- NEW PROJECTS FOR PRODUCTION
('OLIVAREZ PLAZA (NEW)', NULL, 'Calamba, Laguna', '400 KG WITH STRUCTURE / 2 STOPS', NULL, NULL, NULL, 'on_going_production', NULL, NULL, NULL),
('RELIABLE BLDG', NULL, 'Makati', 'MODERNIZATION', NULL, NULL, NULL, 'on_going_production', NULL, NULL, NULL),
('FILINVEST 2', NULL, 'Quezon City', '4 FLOOR HYDRAULIC ELEVATOR', NULL, NULL, NULL, 'on_going_production', NULL, NULL, NULL),
('TESDA BLDG - PILI', NULL, 'Pili, Bicol Region', '630 KG / 3 STOPS', NULL, NULL, NULL, 'on_going_production', NULL, NULL, NULL),
('NAGA DIALYSIS (ADDITIONAL UNIT)', NULL, 'Naga', '1000 KG / 3 STOPS', NULL, NULL, NULL, 'on_going_production', NULL, NULL, NULL);
