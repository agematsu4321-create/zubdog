"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImage = {
    id: number;
    image_url: string;
};

type ProductGalleryProps = {
    images: ProductImage[];
    productName: string;
};

export default function ProductGallery({
    images,
    productName,
}: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(
        images[0]?.image_url ?? ""
    );

    if (!selectedImage) {
        return null;
    }

    return (
        <div className="flex w-full max-w-[560px] gap-4">

            {/* THUMBNAILS */}
            <div className="flex w-20 shrink-0 flex-col gap-3">
                {images.map((image) => (
                    <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImage(image.image_url)}
                        className={`relative aspect-square w-20 overflow-hidden border ${selectedImage === image.image_url
                            ? "border-[#E7D9BE]"
                            : "border-transparent"
                            }`}
                    >
                        <Image
                            src={image.image_url}
                            alt={productName}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* MAIN IMAGE */}
            <div className="relative aspect-square min-w-0 flex-1 overflow-hidden">
                <Image
                    src={selectedImage}
                    alt={productName}
                    fill
                    priority
                    sizes="(max-width: 768px) 80vw, 460px"
                    className="object-cover"
                />
            </div>

        </div>
    );
}
