#!/usr/bin/env node

import ScriptSession from '../clients/script-session'

export default async function placeholder() {
  console.log('placeholder script run with the following arguments:', {
    session: ScriptSession,
  })
}
