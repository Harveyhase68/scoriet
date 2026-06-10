import { ActivityIndicator, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../auth/AuthContext'
import Centered from '../components/Centered'
import Button from '../components/Button'
import { colors } from '../theme'
import type { RootStackParamList } from './types'
import LoginScreen from '../screens/LoginScreen'
import SetupScreen from '../screens/SetupScreen'
{:for nmaxtables:}
{:if form_set_name ne '':}
import {:filepascalcase:}Screen from '../screens/{:filepascalcase:}Screen'
import {:filesingularpascalcase:}FormScreen from '../screens/{:filesingularpascalcase:}FormScreen'
import {:filesingularpascalcase:}DetailScreen from '../screens/{:filesingularpascalcase:}DetailScreen'
{:endif:}
{:endfor:}

const Stack = createNativeStackNavigator<RootStackParamList>()

/** Picks the right stack/screen from the auth + setup state (the RN route guard). */
export default function RootNavigator() {
  const { loading, backendError, setup, user, bootstrap } = useAuth()

  if (loading) {
    return (
      <Centered>
        <ActivityIndicator size="large" color={colors.primary} />
      </Centered>
    )
  }

  if (backendError) {
    return (
      <Centered>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Cannot reach the backend</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>
          {backendError}{'\n'}Is Spring Boot running, and is the API URL in app.json correct?
        </Text>
        <Button title="Retry" variant="outline" onPress={() => void bootstrap()} />
      </Centered>
    )
  }

  if (!setup?.installed) {
    return <SetupScreen />
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
{:for nmaxtables:}
{:if form_set_name ne '':}
        <Stack.Screen name="{:filepascalcase:}" component={{:filepascalcase:}Screen} options={{ title: '{:filepascalcase:}' }} />
        <Stack.Screen name="{:filesingularpascalcase:}Form" component={{:filesingularpascalcase:}FormScreen} options={{ title: '{:filesingularpascalcase:}' }} />
        <Stack.Screen name="{:filesingularpascalcase:}Detail" component={{:filesingularpascalcase:}DetailScreen} options={{ title: '{:filesingularpascalcase:}' }} />
{:endif:}
{:endfor:}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
