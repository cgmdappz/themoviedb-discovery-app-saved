import RoiMovieWidget, {
  type RoiMovie,
  type RoiMovieState,
} from '../RoiMovieWidget/RoiMovieWidget';

export type BestRoiMovie = RoiMovie;
export type BestRoiMovieState = RoiMovieState;

export interface BestRoiMovieWidgetProps {
  /** État ou film sélectionné et ROI fourni par la source des données. */
  state: BestRoiMovieState;
}

export default function BestRoiMovieWidget({ state }: BestRoiMovieWidgetProps) {
  return <RoiMovieWidget state={state} kind="best" />;
}
