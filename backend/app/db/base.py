# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.user_follow import UserFollow  # noqa
from app.models.market import Market  # noqa
from app.models.contract import Contract  # noqa
from app.models.idea import Idea  # noqa
from app.models.idea_like import IdeaLike  # noqa
from app.models.idea_comment import IdeaComment  # noqa
from app.models.idea_bookmark import IdeaBookmark  # noqa
from app.models.market_bookmark import MarketBookmark  # noqa
from app.models.order import Order  # noqa
from app.models.trade import Trade  # noqa
from app.models.position import Position  # noqa 