type ImagePreviewProps = {
  dataUri: string;
};

export const ImagePreview = ({ dataUri }: ImagePreviewProps) => (
  <img
    src={dataUri}
    alt="Response body"
    className="max-w-full max-h-80 rounded object-contain"
  />
);
