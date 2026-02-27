<components>
 - Every component lives in its own PascalCase folder under `src/components/`.
 - The main component goes in `index.tsx` inside the folder.
 - Each file exports ONLY ONE component and its props type.
 - Sub-components used only by the main component get their own PascalCase `.tsx` file in the same folder. e.g. `ConsolePanel/CopyButton.tsx`.
 - Constants go in a `constants.ts` file inside the folder.
 - The `index.tsx` must import sub-components from their files and re-export them for the barrel.
 - All components are re-exported from `src/components/index.tsx` (barrel file).
 - Cross-component imports use the barrel: `import { Foo } from '..'`, **NEVER** `import { Foo } from '../Foo'`.
 - App-level imports use the barrel: `import { Foo, Bar } from './components'`.

 Example structure for a component with sub-components and constants:
 ```
 ComponentName/
   index.tsx        # main component + re-exports sub-components
   SubComponent.tsx # sub-component + its props type
   constants.ts     # constants used by the component
 ```

 Example structure for a simple component:
 ```
 ComponentName/
   index.tsx        # main component + its props type
 ```
</components>
