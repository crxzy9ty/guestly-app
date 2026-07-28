-- Extensions and shared enum types used across the schema.

create extension if not exists pgcrypto;

create type app_role as enum ('owner', 'admin');
