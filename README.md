# AWS S3 Provisioning App (Next.js + Terraform)

## Overview
This project is a proof-of-concept web application that provisions
AWS S3 buckets through a Next.js UI using Terraform automation.

It demonstrates how infrastructure provisioning can be safely exposed
through an internal web tool instead of manual AWS Console operations.

## Architecture
Next.js UI → API route → Terraform execution → AWS S3

## Tech Stack
- Next.js
- Node.js
- Terraform
- AWS S3

## Features
- Web-based provisioning request
- Infrastructure as Code (Terraform)
- Clear execution flow and result feedback
- Extendable to other AWS services

## Demo
📹 Video demo:
https://drive.google.com/file/d/1ZpHWBl_SNN-62j0IcdZykE0EjSRgrv_O/view

## Notes
- AWS credentials are NOT included
- Terraform state files are excluded
- This repository is for demonstration purposes only
