#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

readonly fixture_name="template-injection-test"
readonly values_copy="$(mktemp)"
readonly groups=(
  cacheconfigs controllers datasources discoveries models openapis
  repositories restcruds serviceproviders services relations
  postpatches prediscoverypatches prepatches prerelationpatches
)
readonly patch_groups=(postpatches prediscoverypatches prepatches prerelationpatches)
created_files=()

is_patch_group() {
  local group="$1"
  [[ " ${patch_groups[*]} " == *" ${group} "* ]]
}

cleanup() {
  rm -f "${created_files[@]}" "$values_copy"
}
trap cleanup EXIT

cp chart/values.yaml "$values_copy"

for group in "${groups[@]}"; do
  directory="grases/gras/grapi/${group}"
  if is_patch_group "$group"; then
    file="${directory}/${fixture_name}.sh"
    printf '#!/usr/bin/env bash\necho "%s"\n' "$group" > "$file"
  elif [[ "$group" == "controllers" ]]; then
    file="${directory}/${fixture_name}.controller.ts"
    printf 'export const %s = true;\n' "$fixture_name" > "$file"
  elif [[ "$group" == "serviceproviders" || "$group" == "services" ]]; then
    file="${directory}/${fixture_name}.service.ts"
    printf 'export const %s = true;\n' "$fixture_name" > "$file"
  else
    file="${directory}/${fixture_name}.ts"
    printf 'export const %s = true;\n' "$fixture_name" > "$file"
  fi
  created_files+=("$file")
done

task patch-values-file VALUES_YAML_PATH="$values_copy"

for group in "${groups[@]}"; do
  content="$(yq -r ".grases.gras.grapi.${group}[] | select(.name == \"${fixture_name}\") | .content" "$values_copy")"
  if [[ -z "$content" || "$content" == "null" ]]; then
    echo "Missing ${group} fixture in values.yaml" >&2
    exit 1
  fi
  if ! printf '%s' "$content" | base64 -d >/dev/null 2>&1 && ! printf '%s' "$content" | base64 -D >/dev/null 2>&1; then
    echo "Invalid base64 content for ${group}" >&2
    exit 1
  fi
done

task reset-values-file VALUES_YAML_PATH="$values_copy"

for group in "${groups[@]}"; do
  if [[ "$(yq -r ".grases.gras.grapi.${group} | length" "$values_copy")" != "0" ]]; then
    echo "${group} was not reset" >&2
    exit 1
  fi
done

echo "All grapi injection types were patched, base64-validated, and reset successfully."
