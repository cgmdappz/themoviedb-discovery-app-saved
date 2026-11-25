import RoiMovieWidget, {
  type RoiMovie,
  type RoiMovieState,
} from '../RoiMovieWidget/RoiMovieWidget';

export type LowestRoiMovie = RoiMovie;
export type LowestRoiMovieState = RoiMovieState;

export interface LowestRoiMovieWidgetProps {
  /** État ou film sélectionné et ROI fourni en pourcentage par la source des données. */
  state: LowestRoiMovieState;
}

export default function LowestRoiMovieWidget({
  state,
}: LowestRoiMovieWidgetProps) {
  return <RoiMovieWidget state={state} kind="worst" />;
}
