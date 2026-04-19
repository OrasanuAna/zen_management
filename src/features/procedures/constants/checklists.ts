import type { ProcedureType } from '@/shared/types/entities'
import { ProcedureType as PT } from '@/shared/types/entities'

export type ChecklistItemDef = {
  id: string
  label: string
  hint?: string
}

export const OPENING_CHECKLIST: ChecklistItemDef[] = [
  { id: 'opening_sala', label: 'Sală: mesele aranjate, scaune, condimente și suporturi verificate' },
  { id: 'opening_aerisire', label: 'Aerisire / climatizare — temperatura confortabilă în salon' },
  { id: 'opening_curatenie', label: 'Curățenie rapidă vizibilă (podea, geamuri vitrine, baie clienți)' },
  { id: 'opening_bar', label: 'Bar: aparate pornite, gheață, stoc rece verificat' },
  { id: 'opening_bucatarie', label: 'Bucătărie: echipamente esențiale pornite, igienă liniei de lucru' },
  { id: 'opening_mise', label: 'Mise en place — sosuri, garnituri, tăvițe servire pregătite' },
  { id: 'opening_lumini', label: 'Lumină ambientală și muzică de fundal setate' },
  { id: 'opening_siguranta', label: 'Căi de evacuare libere, extinctor vizibil (dacă e cazul)' },
]

export const CLOSING_CHECKLIST: ChecklistItemDef[] = [
  { id: 'closing_pos', label: 'Casă / POS închis, raport zilnic sau predare schimb (dacă aplică)' },
  { id: 'closing_sala', label: 'Sală: mesele degajate, resturi strânse, șervețele și meniuri la loc' },
  { id: 'closing_bar', label: 'Bar: curățat, recipiente sigilate, aparate curățate / oprite' },
  { id: 'closing_bucatarie', label: 'Bucătărie: echipamente oprite, suprafețe dezinfectate' },
  { id: 'closing_depozit', label: 'Depozit / frigidere: produse perisabile depozitate corect' },
  { id: 'closing_deseuri', label: 'Gunoi / reciclare scoase conform procedurii interne' },
  { id: 'closing_lumini', label: 'Lumini și muzică oprite, vitrine / lumină de noapte setate' },
  { id: 'closing_incuiere', label: 'Uși și ferestre verificate, alarmă / încuiere finală' },
]

export function checklistForType(type: ProcedureType): ChecklistItemDef[] {
  if (type === PT.CLOSING) return CLOSING_CHECKLIST
  return OPENING_CHECKLIST
}

export function initialItemsState(items: ChecklistItemDef[]): Record<string, { done: boolean }> {
  return Object.fromEntries(items.map((i) => [i.id, { done: false }]))
}
