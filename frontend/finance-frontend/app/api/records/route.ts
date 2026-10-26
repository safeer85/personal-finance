import { db } from '@/lib/db';
import { z } from 'zod';
export const runtime = 'nodejs';
const money = z.number().finite().min(0).max(20000000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'Use at most two decimal places');
const schema = z.object({ kind: z.enum(['income','expense','saving','debt','payment']), name: z.string().trim().min(1).max(100), category: z.string().trim().min(1).max(100), amount: money.refine(v => v > 0), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Invalid date'), minimum: money.default(0), target: money.default(0) });
export async function GET() {
  try { return Response.json(await db.record.findMany({ orderBy: [{date:'desc'},{createdAt:'desc'}] })); }
  catch { return Response.json({error:'Unable to load your records.'},{status:500}); }
}
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({error:parsed.error.issues[0].message},{status:400});
    const d = parsed.data;
    if (d.kind === 'debt' && d.minimum > d.amount) return Response.json({error:'Minimum payment cannot exceed the debt balance.'},{status:400});
    const record = await db.$transaction(async tx => {
      if (d.kind === 'payment') {
        const debt = await tx.record.findUnique({where:{id:d.category}});
        if (!debt || debt.kind !== 'debt') throw new Error('Select an existing debt.');
        if (d.date < debt.date) throw new Error('Payment date cannot be before the debt opening date.');
        const paid = await tx.record.aggregate({where:{kind:'payment',category:debt.id},_sum:{amount:true}});
        if (Math.round(d.amount*100) > debt.amount-(paid._sum.amount ?? 0)) throw new Error('Payment exceeds the remaining debt.');
      }
      return tx.record.create({data:{...d,amount:Math.round(d.amount*100),minimum:Math.round(d.minimum*100),target:Math.round(d.target*100)}});
    }, {isolationLevel:'Serializable'});
    return Response.json(record,{status:201});
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (['Select an existing debt.','Payment exceeds the remaining debt.','Payment date cannot be before the debt opening date.'].includes(message)) return Response.json({error:message},{status:400});
    return Response.json({error:'Could not save this record. Please try again.'},{status:500});
  }
}
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({error:'Missing record ID'},{status:400});
  try { await db.$transaction([db.record.deleteMany({where:{kind:'payment',category:id}}),db.record.delete({where:{id}})]); return Response.json({ok:true}); }
  catch { return Response.json({error:'Could not delete this record.'},{status:400}); }
}
