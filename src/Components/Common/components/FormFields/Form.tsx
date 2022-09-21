import { FormEventHandler } from "react";

type FormProps = {
  id?: string;
  className?: string;
  lastUpdatedOn?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
  children?: React.ReactElement[];
};

export const Form = ({
  id,
  className = "",
  lastUpdatedOn,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  children,
}: FormProps) => {
  return (
    <div className={className}>
      <form
        id={id}
        className="bg-white rounded px-16 py-12 flex flex-col gap-3"
      >
        {children}
      </form>
    </div>
  );
};
