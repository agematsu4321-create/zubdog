import Image from "next/image";
import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

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
            className="group block w-full overflow-hidden md:mx-auto md:max-w-[208px]"
        >
            {/* =========================
          MOBILE
      ========================= */}
            <article
                className="w-full overflow-hidden bg-black md:hidden"
                style={{
                    WebkitTextSizeAdjust: "none",
                    textSizeAdjust: "none",
                }}
            >
                {/* =========================
            PRODUCT IMAGE
        ========================= */}
                <div
                    className="flex w-full justify-center bg-black"
                    style={{
                        paddingTop: "8px",
                        paddingLeft: "6px",
                        paddingRight: "6px",
                    }}
                >
                    <div
                        className="relative shrink-0 overflow-hidden"
                        style={{
                            width: "42vw",
                            height: "42vw",
                        }}
                    >
                        <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="42vw"
                            className="object-cover"
                        />

                        {soldOut && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <span
                                    className="font-medium tracking-[0.12em] text-white"
                                    style={{
                                        fontSize: "10px",
                                    }}
                                >
                                    SOLD OUT
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* =========================
            PRODUCT INFORMATION
        ========================= */}
                <div
                    className="flex w-full flex-col bg-black px-3"
                    style={{
                        height: "62px",
                        paddingTop: "7px",
                        paddingBottom: "7px",
                    }}
                >
                    {/* PRODUCT NAME */}
                    <div
                        className="w-full overflow-hidden"
                        style={{
                            height: "30px",
                        }}
                    >
                        <p
                            className={`${notoSerif.className} font-medium text-[#E7D9BE]`}
                            style={{
                                fontSize: "11px",
                                lineHeight: "15px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {name}
                        </p>
                    </div>

                    {/* PRICE */}
                    <p
                        className="mt-auto text-[#E7D9BE]/70"
                        style={{
                            fontSize: "9px",
                            lineHeight: "11px",
                        }}
                    >
                        ¥{Number(price).toLocaleString()}
                    </p>
                </div>
            </article>

            {/* =========================
          PC
      ========================= */}
            <article className="hidden w-full overflow-hidden bg-zinc-950 shadow-xl md:block">
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
                <div className="flex min-h-[70px] flex-col items-center justify-center bg-zinc-950 px-4 py-3 text-center">
                    <p
                        className={`${notoSerif.className} text-sm font-medium text-[#E7D9BE]`}
                    >
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