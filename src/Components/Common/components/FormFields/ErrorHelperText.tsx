export const ErrorHelperText = (props: { error?: string }) => {
  return (
    <span
      className={`font-medium tracking-wide text-red-500 text-xs mt-2 ml-1 transition-all duration-300 ${
        props.error ? "opacity-100" : "opacity-0"
      }`}
    >
      {props.error}
    </span>
  );
};
