import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveBase64Image } from "@/lib/storage";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().min(3).optional(),
  price: z.number().int().min(0).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]).optional(),
  quantity: z.number().int().min(0).optional(),
  condition: z.enum(["NEW", "USED"]).optional(),
  addImages: z.array(z.string().startsWith("data:image/")).max(6).optional(),
  removeImageIds: z.array(z.string()).optional(),
});

/** Редактирование своего товара: цена, наличие, описание, фото. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { business: true } });
  const isOwner =
    product &&
    (product.business?.ownerId === user.id ||
      product.sellerId === user.id ||
      (await prisma.specialist.findUnique({ where: { userId: user.id } }))?.id === product.specialistId);
  if (!product || !isOwner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (d.removeImageIds?.length) {
      await tx.productImage.deleteMany({ where: { id: { in: d.removeImageIds }, productId: product.id } });
    }
    if (d.addImages?.length) {
      const count = await tx.productImage.count({ where: { productId: product.id } });
      for (let i = 0; i < d.addImages.length; i++) {
        try {
          const url = await saveBase64Image(d.addImages[i]);
          await tx.productImage.create({ data: { productId: product.id, url, sortOrder: count + i } });
        } catch { /* битые пропускаем */ }
      }
    }
    await tx.product.update({
      where: { id: product.id },
      data: {
        title: d.title, price: d.price, description: d.description,
        status: d.status, quantity: d.quantity, condition: d.condition,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
