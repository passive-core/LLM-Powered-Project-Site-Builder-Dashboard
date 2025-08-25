// Move non-component exports to a .ts file so we don't violate fast-refresh rules
import { StagedProcessingProgress } from '../components/InputLengthValidator'
import { useStagedProcessing } from '../utils/inputValidationHooks'

export { useStagedProcessing, StagedProcessingProgress }
