#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const supabaseUrl  = process.env.SUPABASE_URL      || '';
const supabaseKey  = process.env.SUPABASE_ANON_KEY || '';
const schoolName   = process.env.SCHOOL_NAME       || '';
const appPassword  = process.env.APP_PASSWORD      || '';

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

html = html
  .replaceAll('__SUPABASE_URL__',      supabaseUrl)
  .replaceAll('__SUPABASE_ANON_KEY__', supabaseKey)
  .replaceAll('__SCHOOL_NAME__',       schoolName)
  .replaceAll('__APP_PASSWORD__',      appPassword);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html, 'utf8');

console.log('Build complete → dist/index.html');
console.log('  Env vars configured: SUPABASE_URL=' + (supabaseUrl ? 'yes' : 'no') + ', SUPABASE_ANON_KEY=' + (supabaseKey ? 'yes' : 'no') + ', SCHOOL_NAME=' + (schoolName ? 'yes' : 'no') + ', APP_PASSWORD=' + (appPassword ? 'yes' : 'no'));
