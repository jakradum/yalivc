import { useCallback } from 'react';
import { set } from 'sanity';
import { Box, Switch, Text, Stack, Card, Flex, Label } from '@sanity/ui';

export function NoAccessToggle(props) {
  const { value, onChange, readOnly } = props;

  const handleChange = useCallback(
    (event) => {
      onChange(set(Boolean(event.currentTarget.checked)));
    },
    [onChange]
  );

  return (
    <Card padding={3} tone={value ? 'critical' : 'default'} border radius={2}>
      <Stack space={3}>
        <Flex align="center" gap={3}>
          <Switch
            checked={Boolean(value)}
            onChange={handleChange}
            disabled={readOnly}
          />
          <Stack space={2}>
            <Label size={1} weight="semibold" style={{ color: value ? '#e5484d' : undefined }}>
              No Access — Kill Switch
            </Label>
            <Text size={1} muted>
              Immediately revokes all access (LP portal and data room) without deleting the record. Overrides all other access flags.
            </Text>
          </Stack>
        </Flex>
        {value === true && (
          <Card padding={3} tone="critical" border radius={2}>
            <Text size={1} weight="semibold">
              ⚠ Access revoked — this user cannot sign in to any Yali product.
            </Text>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
