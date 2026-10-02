import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
    name: string;
    price: number;
    slug: string;
    image: string;
    soldOut: boolean;
};

export default function ProductCard({
    name,
    price,
    slug,
    image,
    soldOut,
}: ProductCardProps) {
    return (
        <Link
            href={`/products/${slug}`}
            className="group mx-auto block w-full max-w-[208px]"
        >
            <article className="overflow-hidden bg-zinc-950 shadow-xl">
                {/* PRODUCT IMAGE */}
                <div className="bg-zinc-950 p-2">
                    <div className="relative aspect-square w-full overflow-hidden bg-white">
                        <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="208px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                        />

                        {soldOut && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="text-sm font-medium tracking-wider text-white">
                                    SOLD OUT
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCT INFORMATION */}
                <div className="flex min-h-[64px] flex-col items-center justify-center bg-zinc-950 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-white">
                        {name}
                    </p>

                    <p className="mt-2 text-sm text-zinc-400">
                        ¥{Number(price).toLocaleString()}
                    </p>
                </div>
            </article>
        </Link>
    );
}