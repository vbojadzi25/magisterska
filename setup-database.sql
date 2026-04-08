-- Create Denar database user
CREATE USER denar_user WITH PASSWORD 'denar_password_2024';

-- Create development database
CREATE DATABASE denar_dev OWNER denar_user;

-- Create test database
CREATE DATABASE denar_test OWNER denar_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE denar_dev TO denar_user;
GRANT ALL PRIVILEGES ON DATABASE denar_test TO denar_user;

-- Show created databases
\l