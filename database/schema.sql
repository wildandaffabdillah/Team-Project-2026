CREATE DATABASE ppe_system;
USE ppe_system;

-- USERS (admin & supervisor)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(255),
    role ENUM('admin', 'supervisor')
);

-- DETECTION LOG
CREATE TABLE detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    person_detected BOOLEAN,
    helmet BOOLEAN,
    vest BOOLEAN,
    violation BOOLEAN
);

-- ALERTS
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)
);

-- REPORT MANUAL
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    total_workers INT,
    violations INT
);