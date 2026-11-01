# Bangladesh university and demo alumni directory

Data snapshot retrieved from the University Grants Commission of Bangladesh (UGC) on 28 October 2026. Importable records are in data/ugc-universities-2026-10-28.json; departments are in data/bangladesh-departments.json. Startup migration code imports these idempotently and seeds profiles from src/demo-directory.js.

## Imported directory

- 61 public universities
- 116 private universities
- 3 international universities
- 1 cross-border higher education (CBHE) entry
- 181 total UGC directory entries
- Each record keeps its UGC category, source URL, retrieval date, source id, and website where listed.
- UGC directory rows returned no district or division for all 181 entries. Website information was absent for 17 entries. These fields remain empty instead of being guessed.
- UGC listing is recorded separately from current operational status, which has not been verified. UGC notices and markers are retained.

Sources: [UGC Public Universities](https://www.ugc.gov.bd/universities/public-universities), [UGC Private Universities](https://ugc.gov.bd/universities/private-universities), [UGC University Directory](https://www.ugc.gov.bd/universities).

## Departments and profile coverage

The catalog contains 38 configurable departments across engineering, business, social sciences, law, science, agriculture, health, and specialized categories. These department names are a starting catalog, not a claim that every university offers them. Every university-department association is unverified until an administrator supplies an official program source.

The idempotent seed produced 543 fictional alumni profiles: at least 3 for each of the 181 universities and at least 7 for each of the 38 catalog departments in the validated database copy. Generated profiles have education, prior-career examples, projects, and demo milestones. Names, employers, education, career details, projects, and credentials are fictional. Fictional profiles use source_type=fictional_demo and verification_status=not_applicable, with no photos or external profile links. Cards and profiles display “Demo Profile — Fictional Data”; these records are excluded from verification and cannot be marked verified.

No verified individual alumni records were imported. Existing user-submitted alumni remain governed by their current review status.

## Updating the data

Administrators can add institutions and departments through the Administration page or the /api/admin/universities and /api/admin/departments endpoints. Program associations remain awaiting confirmation until an administrator provides a source URL and marks them verified. To update the UGC snapshot, replace the JSON snapshot with a new dated copy, preserve per-record provenance, then restart the server to run the idempotent importer.
