import { useCallback } from 'react';
import { set } from 'sanity';
import { Box, Switch, Text, Stack, Card } from '@sanity/ui';

export function NoAccessToggle(props) {
  const { value, onChange, readOnly } = props;

  const handleChange = useCallback(
    (event) => {
      onChange(set(Boolean(event.currentTarget.checked)));
    },
    [onChange]
  );

  return (
    <Stack space={3}>
      {value === true && (
        <Card padding={3} tone="critical" border>
          <Text size={1} weight="semibold">
            ⚠ Access revoked — this user cannot sign in to any Yali product.
          </Text>
        </Card>
      )}
      <Box>
        <Switch
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={readOnly}
        />
      </Box>
    </Stack>
  );
}
