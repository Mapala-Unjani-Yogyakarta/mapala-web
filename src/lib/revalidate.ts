import { revalidatePath } from "next/cache";

/** Segarkan seluruh halaman agar perubahan admin langsung tampil di website. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}
