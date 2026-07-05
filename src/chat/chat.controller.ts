import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { UserRole } from '../auth/decorator/role.decorator';

interface RequestWithUser extends Request {
    user: {sub : string, role: UserRole};
}

@Controller('chat')
@UseGuards(AccessTokenGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get(':orderId')
    getMessages(
        @Param('orderId') orderId: string,
        @Req() req: RequestWithUser,
    ) {
        return this.chatService.getMessagesByOrder(orderId, req.user.sub);
    }
}
