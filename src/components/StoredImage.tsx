import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoredImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const STORAGE_PREFIX = "storage:vrumfit-files/";

export function toStoredImageRef(path: string) {
  return `${STORAGE_PREFIX}${path}`;
}

export function StoredImage({ src, ...props }: StoredImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let active = true;
    if (!src.startsWith(STORAGE_PREFIX)) {
      setResolvedSrc(src);
      return () => { active = false; };
    }

    const path = src.slice(STORAGE_PREFIX.length);
    supabase.storage.from("vrumfit-files").createSignedUrl(path, 60 * 60).then(({ data }) => {
      if (active && data?.signedUrl) setResolvedSrc(data.signedUrl);
    });

    return () => { active = false; };
  }, [src]);

  return <img src={resolvedSrc} {...props} />;
}