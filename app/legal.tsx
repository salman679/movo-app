import { Text, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Button, s } from "@/components/ui";
export default function Legal() {
  const { type } = useLocalSearchParams<{ type: string }>(),
    privacy = type === "privacy",
    url = privacy
      ? process.env.EXPO_PUBLIC_PRIVACY_URL
      : process.env.EXPO_PUBLIC_TERMS_URL;
  return (
    <Screen>
      <Text style={s.title}>
        {privacy ? "Your data. Your choice." : "Movo Points & rewards"}
      </Text>
      {privacy ? (
        <>
          <Text style={s.muted}>
            Movo collects your name, email, optional phone number, recorded
            activity GPS samples, timestamps, accuracy, optional measured steps,
            and reward or donation transactions. Location is collected during
            activities you start.
          </Text>
          <Text style={s.muted}>
            Your name, avatar, measured steps and verified activity points may
            appear in the leaderboard. Your GPS route is private to you and
            authorized administrators reviewing activity.
          </Text>
          <Text style={s.muted}>
            Delete your account in Settings. GPS recordings, sessions and
            notification data are removed; account identity and reward recipient
            details are erased. Anonymized ledger and fulfillment records are
            retained for 365 days, then removed by the retention job. Backups
            expire on the operator’s documented schedule.
          </Text>
          <Text style={s.muted}>
            Unsynced GPS recordings remain on your device until acknowledged by
            the server. They are removed locally after sync or account deletion.
            App uninstall removes the activity database.
          </Text>
        </>
      ) : (
        <>
          <Text style={s.muted}>
            Only verified activity earns redeemable Movo Points. Points are not
            currency, an investment or a guarantee of cash payment. Earning
            rates, stock and eligibility are determined by the server and
            displayed before redemption.
          </Text>
          <Text style={s.muted}>
            Redemptions are fulfilled manually. Rejected redemptions return the
            points spent. Donation campaign totals are points; any actual
            charitable disbursement is separately handled and reported by the
            operator.
          </Text>
          <Text style={s.muted}>
            Do not record vehicle journeys or falsify activity. Movo is a
            fitness and rewards app, not a medical device.
          </Text>
        </>
      )}
      {url ? (
        <Button
          title={`Read the published ${privacy ? "Privacy Policy" : "Terms"}`}
          onPress={() => void Linking.openURL(url)}
        />
      ) : (
        <Text style={s.muted}>
          The operator must publish its full policy, legal identity and contact
          details before public release. This build includes the product’s data
          and reward explanations.
        </Text>
      )}
    </Screen>
  );
}
