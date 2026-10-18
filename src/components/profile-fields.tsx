import { Field, Select } from "@/components/ui/form";
import { COUNTRY_CODES } from "@/lib/constants";
import { countryName } from "@/lib/utils";

const countries = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name));

function timeZones() {
  const list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return list.includes("UTC") ? list : ["UTC", ...list];
}
const zones = timeZones();

export function CountrySelect({ id = "country", name = "country", defaultValue, error, label = "Country", allowAny }: { id?: string; name?: string; defaultValue?: string | null; error?: string[]; label?: string; allowAny?: string }) {
  return (
    <Field id={id} label={label} error={error}>
      <Select id={id} name={name} defaultValue={defaultValue ?? ""}>
        <option value="">{allowAny ?? "Select a country"}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function TimeZoneSelect({ defaultValue, error }: { defaultValue: string; error?: string[] }) {
  return (
    <Field id="timezone" label="Time zone" hint="Lesson times are shown in this time zone." error={error}>
      <Select id="timezone" name="timezone" defaultValue={defaultValue} aria-describedby="timezone-hint">
        {zones.map((z) => (
          <option key={z} value={z}>
            {z.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
    </Field>
  );
}
