import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  FhirBundle,
  FhirCodeableConcept,
  FhirDosage,
  FhirReference,
  FhirResource,
} from "@/types/abdm/hip";
import { formatDateTime } from "@/Utils/utils";

const conceptText = (concept?: FhirCodeableConcept) =>
  concept?.text ?? concept?.coding?.[0]?.display ?? concept?.coding?.[0]?.code;

const nameOf = (resource?: FhirResource) =>
  typeof resource?.name === "string" ? resource.name : resource?.name?.[0]?.text;

function dosageText(dosage: FhirDosage) {
  if (dosage.text) return dosage.text;
  const dose = dosage.doseAndRate?.[0]?.doseQuantity;
  const repeat = dosage.timing?.repeat;
  const duration = repeat?.boundsDuration;
  return [
    dose && `${dose.value} ${dose.unit ?? ""}`.trim(),
    conceptText(dosage.route),
    conceptText(dosage.timing?.code) ??
      (repeat?.frequency &&
        `${repeat.frequency}/${repeat.period ?? 1} ${repeat.periodUnit ?? ""}`.trim()),
    duration && `${duration.value} ${duration.unit ?? ""}`.trim(),
    dosage.patientInstruction,
  ]
    .filter(Boolean)
    .join(", ");
}

function ResourceLine({ resource }: { resource: FhirResource }) {
  const details = [
    conceptText(resource.clinicalStatus) ?? resource.status,
    resource.criticality,
    ...(resource.dosageInstruction ?? []).map(dosageText),
    ...(resource.note ?? []).map((note) => note.text),
  ].filter(Boolean);

  return (
    <li className="flex flex-col">
      <span className="text-sm text-gray-900">
        {conceptText(resource.code ?? resource.medicationCodeableConcept) ??
          resource.resourceType}
      </span>
      {details.length > 0 && (
        <span className="text-xs text-gray-600">{details.join(" · ")}</span>
      )}
    </li>
  );
}

function RecordSection({
  title,
  resources,
}: {
  title: string;
  resources: FhirResource[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase text-gray-500">
        {title}
      </span>
      <ul className="flex flex-col gap-1.5 border-l-2 border-gray-200 pl-3">
        {resources.map((resource) => (
          <ResourceLine key={resource.id} resource={resource} />
        ))}
      </ul>
    </div>
  );
}

/** A readable rendering of an ABDM document bundle, with the raw FHIR below it. */
export function AbdmRecordView({ bundle }: { bundle: FhirBundle }) {
  const { t } = useTranslation();
  const resources = new Map(
    bundle.entry.map((entry) => [entry.fullUrl, entry.resource]),
  );
  const resolve = (references: (FhirReference | undefined)[] = []) =>
    references.flatMap((reference) => {
      const resource = reference && resources.get(reference.reference);
      return resource ? [resource] : [];
    });

  const composition = bundle.entry.find(
    (entry) => entry.resource.resourceType === "Composition",
  )?.resource;
  const [encounter] = resolve([composition?.encounter]);
  const diagnoses = resolve(
    encounter?.diagnosis?.map((diagnosis) => diagnosis.condition),
  );
  const byline = [
    ...resolve(composition?.author).map(nameOf),
    nameOf(resolve([composition?.custodian])[0]),
    composition?.date && formatDateTime(composition.date),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {composition && (
        <div>
          <div className="font-medium text-gray-900">{composition.title}</div>
          <div className="text-xs text-gray-500">{byline.join(" · ")}</div>
        </div>
      )}
      {diagnoses.length > 0 && (
        <RecordSection title={t("abdm_diagnoses")} resources={diagnoses} />
      )}
      {composition?.section?.map((section) => (
        <RecordSection
          key={section.title}
          title={section.title}
          resources={resolve(section.entry)}
        />
      ))}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="link" size="xs" className="px-0">
            {t("abdm_show_fhir")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-gray-50 p-2 text-xs">
            {JSON.stringify(bundle, null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
