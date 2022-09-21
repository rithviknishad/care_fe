type FieldLabelProps = {
  required?: boolean;
  htmlFor?: string;
  children: string;
};

export default function FieldLabel(props: FieldLabelProps) {
  return (
    <label className="mb-2 block" htmlFor={props.htmlFor}>
      {props.children}
      {props.required && <span className="text-red-500">{" *"}</span>}
    </label>
  );
}
