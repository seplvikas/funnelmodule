-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: funnel
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.22.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `sepl_opportunities`
--

DROP TABLE IF EXISTS `sepl_opportunities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_opportunities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_alias` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `tender_number` varchar(100) DEFAULT NULL,
  `tender_name` varchar(1000) DEFAULT NULL,
  `tender_publish_date` date DEFAULT NULL,
  `requirement_type` varchar(100) DEFAULT NULL,
  `pre_bid_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `submission_end_date` date DEFAULT NULL,
  `estimated_value` decimal(15,2) DEFAULT '0.00',
  `contract_year` int DEFAULT '0',
  `contract_month` int DEFAULT '0',
  `ra` decimal(15,2) DEFAULT '0.00',
  `ra_type` varchar(100) DEFAULT NULL,
  `emd` decimal(15,2) DEFAULT '0.00',
  `emd_value` varchar(50) DEFAULT NULL,
  `emd_exemption` varchar(20) DEFAULT NULL,
  `epbg` decimal(15,2) DEFAULT '0.00',
  `epbg_value` varchar(50) DEFAULT NULL,
  `tender_fees` varchar(50) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `oem_name` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `oic_name` varchar(255) DEFAULT NULL,
  `case_owner_email` varchar(255) DEFAULT NULL,
  `case_owner_name` varchar(255) DEFAULT NULL,
  `case_owners` json DEFAULT NULL,
  `eligible` tinyint(1) DEFAULT '1',
  `remarks` text,
  `created_date` date DEFAULT NULL,
  `current_stage` varchar(100) DEFAULT 'New / Identified',
  `status` enum('Bucket-Active','Bucket-Cold','Ongoing-Active','Submitted','Won','Lost','Drop','Archived') DEFAULT 'Bucket-Active',
  `loss_reason` text,
  `archived_reason` text,
  `assigned_owner_id` int DEFAULT NULL,
  `assigned_owner_name` varchar(255) DEFAULT NULL,
  `assigned_owner_email` varchar(255) DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_by_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pricing_model` varchar(50) DEFAULT NULL,
  `quotation_amount` decimal(15,2) DEFAULT NULL,
  `gst_inclusive` tinyint(1) DEFAULT '1',
  `submission_date` date DEFAULT NULL,
  `l1_cost` decimal(18,2) DEFAULT NULL,
  `l1_company_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_tender_number` (`tender_number`),
  KEY `idx_case_owner_email` (`case_owner_email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=271 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_funnel_stages`
--

DROP TABLE IF EXISTS `sepl_funnel_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_funnel_stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_name` varchar(100) NOT NULL,
  `stage_order` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_stage_history`
--

DROP TABLE IF EXISTS `sepl_stage_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_stage_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` int NOT NULL,
  `from_stage` varchar(100) DEFAULT NULL,
  `to_stage` varchar(100) NOT NULL,
  `moved_by_id` int DEFAULT NULL,
  `moved_by_email` varchar(255) DEFAULT NULL,
  `moved_by_name` varchar(255) DEFAULT NULL,
  `remarks` text,
  `moved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_opportunity` (`opportunity_id`),
  KEY `idx_moved_at` (`moved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_customers`
--

DROP TABLE IF EXISTS `sepl_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_oems`
--

DROP TABLE IF EXISTS `sepl_oems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_oems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_products`
--

DROP TABLE IF EXISTS `sepl_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sepl_notifications`
--

DROP TABLE IF EXISTS `sepl_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sepl_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `notification_type` enum('status_change','owner_assigned','stage_moved','archived') DEFAULT 'status_change',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_opportunity` (`opportunity_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11  9:19:17
