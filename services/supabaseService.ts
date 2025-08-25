import { supabase } from '../supabase/client'

export async function getProjectsForUser(userId: string) {
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId)
  if (error) throw error
  return data
}

export async function createProjectRecord(project: any) {
  const { data, error } = await supabase.from('projects').insert([project]).select()
  if (error) throw error
  return data?.[0]
}

export async function createWorkflowRecord(workflow: any) {
  const { data, error } = await supabase.from('workflows').insert([workflow]).select()
  if (error) throw error
  return data?.[0]
}

export async function createGeneratedAsset(asset: any) {
  const { data, error } = await supabase.from('generated_assets').insert([asset]).select()
  if (error) throw error
  return data?.[0]
}
