#!/usr/bin/env node

import ScriptSession from '../clients/script-session'

export default async function init() {
  console.log('init script run with the following arguments:', {
    session: ScriptSession,
  })
}
