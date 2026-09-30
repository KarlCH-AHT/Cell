import type { Dataset, StoredDataset } from '../domain/types.ts';
import { validateDataset } from '../domain/validation.ts';
import type { Repository } from './repository.ts';
// Optional future backend adapter. The backend owns Databricks authentication, authorization and writes.
export class HttpRepository implements Repository {
  constructor(private baseUrl:string){}
  async load():Promise<StoredDataset|null>{const r=await fetch(`${this.baseUrl}/dataset`,{credentials:'include'});if(r.status===404)return null;if(!r.ok)throw Error(`Load failed (${r.status}).`);const body=await r.json();if(!Number.isInteger(body.version)||body.version<0)throw Error('Invalid server version.');return {version:body.version,data:validateDataset(body.data)};}
  async save(data:Dataset,expectedVersion:number):Promise<number>{const r=await fetch(`${this.baseUrl}/dataset`,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','If-Match':String(expectedVersion)},body:JSON.stringify({data:validateDataset(data)})});if(r.status===409||r.status===412)throw Error('Server data changed; reload before saving.');if(!r.ok)throw Error(`Save failed (${r.status}).`);const b=await r.json();if(!Number.isInteger(b.version)||b.version<=expectedVersion)throw Error('Invalid server version.');return b.version;}
}
