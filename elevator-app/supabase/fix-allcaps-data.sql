-- Fix ALL CAPS text in existing records
-- PostgreSQL initcap() converts "DPWH STA CRUZ" → "Dpwh Sta Cruz"
-- We only touch rows where the text is fully uppercase (existing imports)
-- Mixed-case text is left untouched

-- ops_projects: project_name, pic, subcon, contact_person, address, specs, brand
UPDATE ops_projects SET project_name  = initcap(project_name)  WHERE project_name  = upper(project_name)  AND project_name  <> '';
UPDATE ops_projects SET subcon        = initcap(subcon)        WHERE subcon        = upper(subcon)        AND subcon        <> '';
UPDATE ops_projects SET contact_person= initcap(contact_person)WHERE contact_person= upper(contact_person)AND contact_person<> '';
UPDATE ops_projects SET address       = initcap(address)       WHERE address       = upper(address)       AND address       <> '';
UPDATE ops_projects SET specs         = initcap(specs)         WHERE specs         = upper(specs)         AND specs         <> '';
UPDATE ops_projects SET brand         = initcap(brand)         WHERE brand         = upper(brand)         AND brand         <> '';
-- PIC: keep short names as-is (Vic, Jose) but fix ALL CAPS ones
UPDATE ops_projects SET pic           = initcap(pic)           WHERE pic           = upper(pic)           AND pic           <> '' AND length(pic) > 4;

-- customers
UPDATE customers SET name           = initcap(name)           WHERE name           = upper(name)           AND name           <> '';
UPDATE customers SET contact_person = initcap(contact_person) WHERE contact_person = upper(contact_person) AND contact_person <> '';
UPDATE customers SET address        = initcap(address)        WHERE address        = upper(address)        AND address        <> '';

-- installation_projects
UPDATE installation_projects SET project_name = initcap(project_name) WHERE project_name = upper(project_name) AND project_name <> '';

-- pipelines: supplier field
UPDATE pipelines SET supplier = initcap(supplier) WHERE supplier = upper(supplier) AND supplier <> '';
